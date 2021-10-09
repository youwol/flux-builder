import {ImmutableTree} from "@youwol/fv-tree";
import {Component, GroupModules, ModuleFlux, PluginFlux, Workflow, WorkflowDelta} from "@youwol/flux-core";
import {AppStore} from "../builder-editor/builder-state";
import {HTMLElement$, VirtualDOM} from "@youwol/flux-view";
import {filter, map} from "rxjs/operators";
import {Subscription} from "rxjs";


export namespace ProjectTreeView {

    /*******************************************************************************************************************
     *
     * Nodes
     *
     * Represent modules (Group, Plugin, Component, etc.) in the tree
     *
     */

    /**
     * Functions returning the id of a {@link ModuleNode|Node} representing a {@link ModuleFlux|module}; this node
     * id shall contains the module id for convenient debugging.
     *
     * Shall be instantiate with {@linkcode nodeIdBuilderForUniq}
     *
     */
    export interface NodeIdBuilder {
        /**
         * Return the id of the {@link ModuleNode|Node} representing a module
         *
         * @param mdle the module represented by the node
         */
        buildForModule: (mdle: ModuleFlux) => string,
        /**
         * Return the id of the {@link ModuleNode|Node} representing a module
         *
         * @param idModule the id of the module represented by the node
         */
        buildForModuleId: (idModule: string) => string,
        /**
         * Return the id of the {@link ModuleNode|Node} representing the root component
         *
         */
        buildForRootComponent: () => string,
    }

    /**
     * Factory for {@linkcode NodeIdBuilder}.
     *
     * Will return a collection of functions returning a unique, stable id based on a unique string and the id of a
     * module
     *
     * @param uniq a (not empty, globally unique) string use to define {@link ModuleNode|nodes} id
     */
    export function nodeIdBuilderForUniq(uniq: string): NodeIdBuilder {
        const nodeIdFromModuleId: (moduleId: string) => string =
            (moduleId) => `project_tree_view-${uniq}-${moduleId}`
        return {
            buildForModule: (mdle) => nodeIdFromModuleId(mdle.moduleId),
            buildForModuleId: (moduleId) => nodeIdFromModuleId(moduleId),
            buildForRootComponent: () => nodeIdFromModuleId(Component.rootComponentId),
        }
    }

    /*
    Base class : representing a module
      - node.module will be the module represented
      - node.id is module.moduleId
      - node.getName() return title of the module represented
      - node.children, if any, will be nodes representing Group (or Component) content and plugins attached to the
       module represented
     */
    export class ModuleNode extends ImmutableTree.Node {

        /* The module that this node represent */
        module: ModuleFlux

        /* Call ImmutableTree.Node constructor and store the module */
        constructor(nodeId: string, module: ModuleFlux, childrenNodes?: ModuleNode[]) {
            super({id: nodeId, children: childrenNodes});
            this.module = module
        }

        /* The name of this node (for UI) is the title of the module represented */
        getModuleTitle(): string {
            return this.module.configuration.title
        }

        getModuleId(): string {
            return this.module.moduleId
        }
    }

    /*
    GroupNode is a specialisation of ModuleNode for representing a Group.
      Always has an array of children nodes, maybe empty
     */
    export class GroupNode extends ModuleNode {
        constructor(nodeId: string, module: GroupModules.Module, childrenNodes: ModuleNode[]) {
            super(nodeId, module, childrenNodes);
        }
    }

    /*
    ComponentNode is a specialisation of GroupNode (and therefore of ModuleNode) for representing a Component
      Always has an array of children nodes, maybe empty
     */
    export class ComponentNode extends GroupNode {
        constructor(nodeId: string, module: Component.Module, childrenNodes: ModuleNode[]) {
            super(nodeId, module, childrenNodes);
        }
    }

    /*
    PluginNode is a specialisation of ModuleNode for representing a Plugin ; never has children nodes
     */
    export class PluginNode extends ModuleNode {
        constructor(nodeId: string, module: PluginFlux<any>) {
            super(nodeId, module);
        }
    }


    /*******************************************************************************************************************
     *
     *  Nodes factories functions
     *
     *  Construct a tree from AppStore
     *  Construct a node from a Module and a Workflow
     *
     */

    /* Bootstrap the whole tree construction from the AppStore */
    function rootFactory(appStore: AppStore, nodeIdBuilder: NodeIdBuilder) {
        let workflow = appStore.project.workflow
        return nodeFactory(
            workflow.modules.find(m => m.moduleId == 'Component_root-component') as Component.Module,
            workflow,
            nodeIdBuilder
        )
    }

    /*
      Construct a node, representing this module, with its content (if module is a Group or a Component) and
      its plugins attached as children nodes
     */
    function nodeFactory(module: ModuleFlux, workflow: Workflow, nodeIdBuilder: NodeIdBuilder) {
        let nodeId = nodeIdBuilder.buildForModule(module)

        // Will hold nodes representing Group content and Plugins attached to this module
        let childrenNodes: ModuleNode[] = []

        // Get plugins attach to this module
        childrenNodes.push(...
            workflow.plugins
                .filter((plugin) => plugin.parentModule.moduleId == module.moduleId)
                .map((plugin) => nodeFactory(plugin, workflow, nodeIdBuilder))
        )

        // Get content, if this module is a Group (or a Component, since it inherit from Group)
        if (module instanceof GroupModules.Module) {
            childrenNodes.push(...
                module.getDirectChildren(workflow)
                    .filter((child) => !(child instanceof PluginFlux))
                    .map((child) => nodeFactory(child, workflow, nodeIdBuilder))
            )
        }

        // Call the right constructor
        if (module instanceof Component.Module) { // Order DOES matter (ComponentNode is also a GroupNode)
            return new ComponentNode(nodeId, module, childrenNodes);
        } else if (module instanceof GroupModules.Module) {
            return new GroupNode(nodeId, module, childrenNodes)
        } else if (module instanceof PluginFlux) {
            // This module can't have plugins and has no content
            return new PluginNode(nodeId, module)
        } else {
            // If there is no plugins, and since this module is not a Group, we don't pass an empty array to the
            // constructor because this would create an empty list of children nodes for this node
            return (childrenNodes.length != 0) ? new ModuleNode(nodeId, module, childrenNodes) : new ModuleNode(nodeId, module)
        }

    }


    /*******************************************************************************************************************
     *
     * State
     *
     * Connect to observables AppStore and maintain the tree
     *
     */

    /*
    State of the view
     - Connected to AppStore observables (module selection, project update)
     - Update AppStore to module represented by selected node
     */
    export class State extends ImmutableTree.State<ModuleNode> {
        /* Will hold subscriptions for this specialisation of State */
        private readonly projectTreeSubscriptions: Subscription[] = []
        /* The AppStore */
        public readonly appStore: AppStore

        private readonly nodeIdBuilder: NodeIdBuilder

        /**
         * Convenient method to easily instantiate a State
         *
         * @param appStore
         * @param uniq the string use to generate unique {@link ModuleNode|node} id from module id (See {@linkcode
         * nodeIdBuilderForUniq})
         */
        static stateForAppStoreAndUniq(appStore: AppStore, uniq: string): State {
            let nodeIdBuilder = nodeIdBuilderForUniq(uniq)
            return new State(appStore, nodeIdBuilder)
        }

        /*
        Constructor from AppStore
         - Use rootFactory to call the constructor of the parent
         - Root node is expanded by default
         - store AppStore
         - connect subscriptions
         */
        private constructor(appStore: AppStore, nodeIdBuilder: NodeIdBuilder) {
            super({
                    rootNode: rootFactory(appStore, nodeIdBuilder),
                    expandedNodes: [nodeIdBuilder.buildForRootComponent()]
                }
            )
            this.appStore = appStore
            this.nodeIdBuilder = nodeIdBuilder
            this.subscribe();
        }

        /*  Observables subscriptions */
        private subscribe() {
            let appObservables = this.appStore.appObservables

            this.projectTreeSubscriptions.push(
                // WHEN App project change UPDATE Tree
                appObservables.projectUpdated$.subscribe((delta) => this.onAppProjectUpdated(delta)),

                // WHEN App selected module change UPDATE Tree selected node
                appObservables.moduleSelected$.subscribe((module) => this.onAppModuleSelected(module)),

                // WHEN Tree selected node change UPDATE APP selected module
                // EXCEPT If module already selected
                //       OR node is root component
                this.selectedNode$
                    // get id from node and ensure module is not already selected and is not root Component
                    .pipe(
                        // node => moduleId
                        map((node) => node.getModuleId()),
                        // module not selected in AppStore && module not root Component
                        filter((id) => !this.appStore.isSelected(id) && id != Component.rootComponentId)
                    )
                    .subscribe((id) => this.appStore.selectModule(id, true))
            )
        }

        /* To be called by the View, when the virtualDOM is remove */
        unsubscribe() {
            this.projectTreeSubscriptions.forEach((s) => s.unsubscribe())
            super.unsubscribe();
        }

        /**
         Action when a module is selected in AppStore
         */
        private onAppModuleSelected(module: ModuleFlux) {
            this.selectedNode$.next(this.getNode(this.nodeIdBuilder.buildForModule(module)))

            // Expand tree to show this node. This could (should ?) be implemented in immutable-tree.view.ts
            let node = this.getNode(this.nodeIdBuilder.buildForModule(module))
            let ensureExpanded: string[] = [node.id]

            // Ensure parents nodes are also expanded
            let parent = this.getParent(node.id)
            while (parent != undefined) {
                ensureExpanded.push(parent.id)
                parent = this.getParent(parent.id)
            }
            // Put parents at the begin
            ensureExpanded.reverse()


            // Currently expanded nodes
            const actualExpanded = this.expandedNodes$.getValue();

            // One-liner for filtering unique values of an array
            const arrayUniq = (v, i, s) => s.indexOf(v) === i
            // What we want
            const expectedExpanded = actualExpanded.concat(ensureExpanded).filter(arrayUniq);

            // Update tree expanded nodes
            this.expandedNodes$.next(expectedExpanded)
        }

        /**
         Action when the project as a whole is updated
         */
        private onAppProjectUpdated(delta: WorkflowDelta) {
            // TODO : effectively use delta …
            this.reset(rootFactory(this.appStore, this.nodeIdBuilder))
        }

    }


    /*******************************************************************************************************************
     *
     * View
     *
     * Render the tree from State
     *
     */

    /*
    Node rendering
     */
    function nodeHeaderView(state: State, node: ModuleNode): VirtualDOM {
        // Classes for the vDOM
        const vDomClasses = 'd-flex fv-pointer align-items-center';

        // Root node is a special case («play» icon, bigger font, use project name)
        if (node.id == Component.rootComponentId) {
            return {
                class: vDomClasses,
                children: [
                    {class: 'p-0 mx-2 fas fa-play'},
                    {innerText: `${(state.appStore.project.name)}`}
                ]
            }
        }

        // fontAwesome icon for this node
        let faClass
        if (node instanceof ComponentNode) { // Order DOES matter (ComponentNode is also a GroupNode)
            faClass = "fa-cube"
        } else if (node instanceof GroupNode) {
            faClass = "fa-object-group"
        } else if (node instanceof PluginNode) {
            faClass = "fa-puzzle-piece"
        }
        // fatClass might be left undefined (i.e. no icon)

        return {
            class: vDomClasses,
            style: {fontSize: 'smaller'},
            children: [
                {class: faClass ? `mx-2 fas ${faClass}` : ""},
                {innerText: node.getModuleTitle()}
            ]
        }
    }

    /*
    View class
     - Define how to render the tree, and use nodeHeaderView for rendering a node
     - declare callBack for disconnecting subscriptions of the State
     */
    export class View extends ImmutableTree.View<ProjectTreeView.ModuleNode> {

        class = "h-100 overflow-auto"
        disconnectedCallback: (elem) => void

        constructor({state, ...others}: { state: State }) {
            super({state: state, headerView: nodeHeaderView, ...others});
            this.disconnectedCallback = (element$: HTMLElement$ & HTMLDivElement) => (this.state as ProjectTreeView.State).unsubscribe()

        }

    }


    /*******************************************************************************************************************
     *
     * Miscellaneous
     *
     * Helper functions
     *
     */

    /* Helper function for instantiating both View and State from AppStore */
    export function viewForAppstore(appStore: AppStore, uniq: string) {
        return new ProjectTreeView.View({
                state: ProjectTreeView.State.stateForAppStoreAndUniq(appStore, uniq)
            }
        )
    }
}
