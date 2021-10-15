import {ImmutableTree} from "@youwol/fv-tree";
import {Component, GroupModules, ModuleFlux, PluginFlux, Workflow, WorkflowDelta} from "@youwol/flux-core";
import {AppStore} from "../builder-editor/builder-state";
import {HTMLElement$, VirtualDOM} from "@youwol/flux-view";
import {filter, map} from "rxjs/operators";
import {Subscription} from "rxjs";


export namespace ProjectTreeView {

    /**
     * Functions returning the id of a {@link ModuleNode|node} representing a {@link ModuleFlux|module}; this string
     * shall contains the module id for convenient debugging.
     *
     * Shall be instantiate with {@link nodeIdBuilderForUniq}.
     *
     * @category Nodes Id
     *
     */
    export interface NodeIdBuilder {
        /**
         * Return the id of the {@link ModuleNode|node} representing a {@link ModuleFlux|module}.
         *
         * @param mdle the module represented by the node
         */
        buildForModule: (mdle: ModuleFlux) => string,
        /**
         * Return the id of the {@link ModuleNode|node} representing a {@link ModuleFlux|module}.
         *
         * @param moduleId the id of the module represented by the node
         */
        buildForModuleId: (moduleId: string) => string,
        /**
         * Return the id of the {@link ModuleNode|Node} representing the root component
         *
         */
        buildForRootComponent: () => string,
    }

    /**
     * Factory for {@link NodeIdBuilder}.
     *
     * Will return a collection of functions returning a unique, stable id based on a unique string and the id of a
     * {@link ModuleFlux|module}.
     *
     * @param uniq a (not empty, globally unique) string use to define {@link ModuleNode|nodes} ids
     *
     * @category Nodes Id
     *
     */
    export function nodeIdBuilderForUniq(uniq: string): NodeIdBuilder {
        if (uniq === undefined || uniq === null || uniq.length == 0) {
            throw new Error("Unique string must be defined and not empty")
        }
        const nodeIdFromModuleId: (moduleId: string) => string =
            (moduleId) => `project_tree_view-${uniq}-${moduleId}`
        return {
            buildForModule: (mdle) => nodeIdFromModuleId(mdle.moduleId),
            buildForModuleId: (moduleId) => nodeIdFromModuleId(moduleId),
            buildForRootComponent: () => nodeIdFromModuleId(Component.rootComponentId),
        }
    }

    /**
     * Base class for representing a {@link ModuleFlux|module}, extending {@link ImmutableTree.Node}
     *
     * Children can represent other modules (i.e this node represent a {@link GroupModules.Module|group} or a
     * {@link Component.Module|component}) and {@link PluginFlux|plugins}.
     *
     * @category Nodes
     *
     */
    export class ModuleNode extends ImmutableTree.Node {

        private readonly mdle: ModuleFlux

        constructor(nodeId: string, mdle: ModuleFlux, childrenNodes?: ModuleNode[]) {
            super({id: nodeId, children: childrenNodes});
            this.mdle = mdle
        }

        /**
         * The title of the {@link ModuleFlux|module} represented.
         *
         */
        getModuleTitle(): string {
            return this.mdle.configuration.title
        }

        /**
         * The id of the {@link ModuleFlux|module} represented.
         *
         */
        getModuleId(): string {
            return this.mdle.moduleId
        }
    }

    /**
     *
     * Specialisation of {@link ModuleNode} for representing a {@link GroupModules.Module|group}.
     *
     * Always has an array of children {@link ModuleNode|nodes}, maybe empty.
     *
     * @category Nodes
     *
     */
    export class GroupNode extends ModuleNode {
        constructor(nodeId: string, mdle: GroupModules.Module, childrenNodes: ModuleNode[]) {
            super(nodeId, mdle, childrenNodes);
        }
    }

    /**
     * Specialisation of {@link GroupNode} (itself a specialisation of {@link ModuleNode}) for representing a
     * {@link Component.Module|component}.
     *
     * @category Nodes
     *
     */
    export class ComponentNode extends GroupNode {
        constructor(nodeId: string, mdle: Component.Module, childrenNodes: ModuleNode[]) {
            super(nodeId, mdle, childrenNodes);
        }
    }

    /**
     * Specialisation of {@link ModuleNode} for representing a {@link PluginFlux|plugin}.
     *
     * Never has children.
     *
     * @category Nodes
     *
     */
    export class PluginNode extends ModuleNode {
        constructor(nodeId: string, mdle: PluginFlux<any>) {
            super(nodeId, mdle);
        }
    }


    /**
     *  Bootstrap the whole tree construction from an {@link AppStore|appStore} and
     *  a {@link NodeIdBuilder|nodeIdBuilder}.
     *
     * @category Nodes
     *
     */
    export function rootFactory(workflow: Workflow, nodeIdBuilder: NodeIdBuilder): ModuleNode {
        const rootComponent = workflow.modules.find(m => m.moduleId == Component.rootComponentId) as Component.Module;
        if (rootComponent === undefined) {
            throw new Error("No root component for this project")
        }

        return nodeFactory(
            rootComponent,
            workflow,
            nodeIdBuilder
        )
    }

    /**
     *
     * Construct a {@link ModuleNode|node}, representing a {@link ModuleFlux|module} with its content (if
     * this module is a {@link GroupModules.Module|group} or a {@link Component.Module|component}) and its
     * {@link PluginFlux|plugins} attached as children {@link ModuleNode|nodes}.
     *
     * @category Nodes
     *
     */
    export function nodeFactory(mdle: ModuleFlux, workflow: Workflow, nodeIdBuilder: NodeIdBuilder): ModuleNode {
        let nodeId = nodeIdBuilder.buildForModule(mdle)

        // Will hold nodes representing Group content and Plugins attached to this module
        let childrenNodes: ModuleNode[] = []

        // Get plugins attach to this module
        childrenNodes.push(...
            workflow.plugins
                .filter((plugin) => plugin.parentModule.moduleId == mdle.moduleId)
                .map((plugin) => nodeFactory(plugin, workflow, nodeIdBuilder))
        )

        // Get content, if this module is a Group (or a Component, since it inherit from Group)
        if (mdle instanceof GroupModules.Module) {
            childrenNodes.push(...
                mdle.getDirectChildren(workflow)
                    .filter((child) => !(child instanceof PluginFlux))
                    .map((child) => nodeFactory(child, workflow, nodeIdBuilder))
            )
        }

        // Call the right constructor
        if (mdle instanceof Component.Module) { // Order DOES matter (ComponentNode is also a GroupNode)
            return new ComponentNode(nodeId, mdle, childrenNodes);
        } else if (mdle instanceof GroupModules.Module) {
            return new GroupNode(nodeId, mdle, childrenNodes)
        } else if (mdle instanceof PluginFlux) {
            // This module can't have plugins and has no content
            return new PluginNode(nodeId, mdle)
        } else if (mdle instanceof ModuleFlux) {
            // If there is no plugins, and since this module is not a Group, we don't pass an empty array to the
            // constructor because this would create an empty list of children nodes for this node
            return (childrenNodes.length != 0) ? new ModuleNode(nodeId, mdle, childrenNodes) : new ModuleNode(nodeId, mdle)
        } else {
            throw new Error("Unknown module class for project tree view node creation")
        }

    }


    /**
     * Maintain state for the {@link View}.
     * - Update the tree using the {@link AppStore|appStore} observable for
     *   {@link AppObservables.projectUpdated$|project update}.
     * - Update selected node using the {@link AppStore|appStore} observable for
     *   {@link AppObservables.moduleSelected$|module selection}.
     * - Update selected {@link ModuleFlux|module} selected in the {@link AppStore|appStore} by calling
     *   {@link AppStore.modulesSelected|appStore.modulesSelected()}.
     *
     * @category State
     *
     */
    export class State extends ImmutableTree.State<ModuleNode> {
        /**
         * Hold {@link Subscription|subscriptions} for this specialisation of {@link ImmutableTree.State}
         *
         * @category Subscriptions
         *
         */
        private readonly projectTreeSubscriptions: Subscription[] = []
        /* The AppStore */
        public readonly appStore: AppStore

        private readonly nodeIdBuilder: NodeIdBuilder

        /**
         * Convenient method to easily instantiate a State
         *
         * @param appStore the AppStore
         * @param uniq the string use to generate unique {@link ModuleNode|node} id from {@link ModuleFlux|module} id
         * (See {@link nodeIdBuilderForUniq})
         *
         * @category Construction
         *
         */
        static stateForAppStoreAndUniq(appStore: AppStore, uniq: string): State {
            let nodeIdBuilder = nodeIdBuilderForUniq(uniq)
            return new State(appStore, nodeIdBuilder)
        }

        /**
         * Constructor from AppStore
         * - build the root node with {@link rootFactory})
         * - connect subscriptions
         *
         * @category Construction
         *
         * @param appStore
         * @param nodeIdBuilder
         *
         */
        private constructor(appStore: AppStore, nodeIdBuilder: NodeIdBuilder) {
            super({
                    rootNode: rootFactory(appStore.project.workflow, nodeIdBuilder),
                    expandedNodes: [nodeIdBuilder.buildForRootComponent()]
                }
            )
            this.appStore = appStore
            this.nodeIdBuilder = nodeIdBuilder
            this.subscribe();
        }

        /**
         * Create {@link Subscription|subscriptions} and store them in {@link State.projectTreeSubscriptions}.
         *
         * - {@link AppStore|appStore}’s {@link AppObservables.projectUpdated$|project update}
         *   => {@link State.updateTree()}
         * - {@link AppStore|appStore}’s {@link AppObservables.moduleSelected$|module selection}
         *   => {@link State.selectNodeRepresentingModule()}
         * - parent’s {@link ImmutableTree.State.selectedNode$|node selection}
         *   => {@link AppStore.modulesSelected|appStore.moduleSelected()}
         *
         * @category Subscriptions
         *
         */
        private subscribe() {
            let appObservables = this.appStore.appObservables

            this.projectTreeSubscriptions.push(
                // WHEN App project change UPDATE Tree
                appObservables.projectUpdated$.subscribe((delta) => this.updateTree(delta)),

                // WHEN App selected module change UPDATE Tree selected node
                appObservables.moduleSelected$.subscribe((mdle) => this.selectNodeRepresentingModule(mdle)),

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

        /**
         * Unsubscribe own {@link Subscription|subscriptions} stored in {@link State.projectTreeSubscriptions}.
         *
         * To be called by the {@link View}, when the virtualDOM is remove.
         *
         * @category Subscriptions
         *
         */
        unsubscribe() {
            this.projectTreeSubscriptions.forEach((s) => s.unsubscribe())
            // Clear array
            this.projectTreeSubscriptions.splice(0, this.projectTreeSubscriptions.length)
            super.unsubscribe();
        }

        /**
         * Select the {@link ModuleNode|node} representing a given {@link ModuleFlux|module}
         *
         * To be called When {@link AppStore|appStore} module selection change
         *
         * @category Subscriptions
         *
         */
        private selectNodeRepresentingModule(mdle: ModuleFlux) {
            this.selectedNode$.next(this.getNode(this.nodeIdBuilder.buildForModule(mdle)))

            // Expand tree to show this node. This could (should ?) be implemented in immutable-tree.view.ts
            let node = this.getNode(this.nodeIdBuilder.buildForModule(mdle))
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
         * Update tree.
         *
         * To be called when {@link AppStore|appStore} project update.
         *
         * TODO: effectively use delta from {@link AppObservables.projectUpdated$}, currently
         * calling {@link ImmutableTree.State.reset|reset()}
         *
         * @category Subscriptions
         *
         */
        private updateTree(delta: WorkflowDelta) {
            // TODO : effectively use delta …
            this.reset(rootFactory(this.appStore.project.workflow, this.nodeIdBuilder))
        }

    }

    /**
     * {@link ModuleNode|Node} rendering.
     *
     * To be used by the {@link View|view}
     *
     * @category View
     *
     */
    export function nodeHeaderView(state: State, node: ModuleNode): VirtualDOM {
        // Classes for the vDOM
        const vDomClasses = 'project-tree-node d-flex fv-pointer align-items-center';

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

    /**
     * The View
     * - Define how to render the tree, and use {@link nodeHeaderView} for rendering a {@link ModuleNode|node}
     * - declare callBack for disconnecting subscriptions of the {@link State|state} via {@link State.unsubscribe}
     *
     * @category View
     *
     */
    export class View extends ImmutableTree.View<ProjectTreeView.ModuleNode> {

        class = "h-100 overflow-auto"
        disconnectedCallback: (elem) => void

        constructor({state, ...others}: { state: State }) {
            super({state: state, headerView: nodeHeaderView, ...others});
            this.disconnectedCallback = (element$: HTMLElement$ & HTMLDivElement) => (this.state as ProjectTreeView.State).unsubscribe()

        }

    }

}
