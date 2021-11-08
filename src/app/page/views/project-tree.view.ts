/** @format */
import {
    Component,
    GroupModules,
    ModuleFlux,
    PluginFlux,
    Workflow,
    WorkflowDelta,
} from '@youwol/flux-core'
import { VirtualDOM } from '@youwol/flux-view'
import { ImmutableTree } from '@youwol/fv-tree'
import { Observable, Subscription } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { AppStore } from '../../builder-editor/builder-state'
import {
    NodeIdBuilder,
    nodeIdBuilderForUniq,
    selectNodeAndExpand,
} from '../../externals_evolutions/fv-tree/immutable-tree'

export namespace ProjectTreeView {
    export interface ProjectManager {
        /**
         * Function returning the name of the project
         *
         */
        name: () => string
        /**
         * Function returning the workflow of the project
         *
         */
        workflow: () => Workflow
        /**
         * Will be subscribed to update the tree when project is updated
         *
         */
        projectUpdated$: Observable<WorkflowDelta>
        /**
         * Will be subscribed to select the corresponding node when a module is selected
         *
         */
        moduleSelected$: Observable<ModuleFlux>
        /**
         * Can prevent call to {@link selectModule} when a node is selected
         *
         * @param moduleId the moduleId of the module, from the selected node
         */
        filterSelection: (moduleId: string) => boolean
        /**
         * Will be call on node selection, unless filtered by {@link filterSelection}
         *
         * @param moduleId the moduleId of the module, from the selected node
         */
        selectModule: (moduleId: string) => void
        /**
         * Can prevent a node to be inserted into the final tree
         *
         * @param node the node to be inserted
         */
        filterNode?: (node: ModuleNode) => boolean
    }

    export function appStoreAsProjectManager(
        appStore: AppStore,
    ): ProjectManager {
        return {
            name: () => appStore.project.name,
            workflow: () => appStore.project.workflow,
            projectUpdated$: appStore.appObservables.projectUpdated$,
            moduleSelected$: appStore.appObservables.moduleSelected$,
            selectModule: (moduleId) => appStore.selectModule(moduleId, true),
            filterSelection: (moduleId) =>
                !appStore.isSelected(moduleId) &&
                moduleId !== Component.rootComponentId,
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
        readonly mdle: ModuleFlux

        constructor(
            nodeId: string,
            mdle: ModuleFlux,
            childrenNodes?: ModuleNode[],
        ) {
            super({ id: nodeId, children: childrenNodes })
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
        constructor(
            nodeId: string,
            mdle: GroupModules.Module,
            childrenNodes: ModuleNode[],
        ) {
            super(nodeId, mdle, childrenNodes)
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
        constructor(
            nodeId: string,
            mdle: Component.Module,
            childrenNodes: ModuleNode[],
        ) {
            super(nodeId, mdle, childrenNodes)
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
        constructor(nodeId: string, mdle: PluginFlux<ModuleFlux>) {
            super(nodeId, mdle)
        }
    }

    /**
     *  Bootstrap the whole tree construction from a {@link ProjectManager|projectManager} and
     *  a {@link NodeIdBuilder|nodeIdBuilder}.
     *
     * @category Nodes
     *
     */
    export function rootFactory(
        workflow: Workflow,
        nodeIdBuilder: NodeIdBuilder,
        filterNode: (node: ModuleNode) => boolean = (_m) => true,
    ): ModuleNode {
        const rootComponent = workflow.modules.find(
            (m) => m.moduleId == Component.rootComponentId,
        ) as Component.Module
        if (rootComponent === undefined) {
            throw new Error('No root component for this project')
        }

        return nodeFactory(rootComponent, workflow, nodeIdBuilder, filterNode)
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
    export function nodeFactory(
        mdle: ModuleFlux,
        workflow: Workflow,
        nodeIdBuilder: NodeIdBuilder,
        filterNode: (node: ModuleNode) => boolean,
    ): ModuleNode {
        const nodeId = nodeIdBuilder.buildForModule(mdle)

        // Will hold nodes representing Group content and Plugins attached to this module
        const childrenNodes: ModuleNode[] = []

        // Get plugins attach to this module
        childrenNodes.push(
            ...workflow.plugins
                .filter(
                    (plugin) => plugin.parentModule.moduleId == mdle.moduleId,
                )
                .map((plugin) =>
                    nodeFactory(plugin, workflow, nodeIdBuilder, filterNode),
                )
                .filter((node) => filterNode(node)),
        )

        // Get content, if this module is a Group (or a Component, since it inherit from Group)
        if (mdle instanceof GroupModules.Module) {
            childrenNodes.push(
                ...mdle
                    .getDirectChildren(workflow)
                    .filter((child) => !(child instanceof PluginFlux))
                    .map((child) =>
                        nodeFactory(child, workflow, nodeIdBuilder, filterNode),
                    )
                    .filter((node) => filterNode(node)),
            )
        }

        // Call the right constructor
        if (mdle instanceof Component.Module) {
            // Order DOES matter (ComponentNode is also a GroupNode)
            return new ComponentNode(nodeId, mdle, childrenNodes)
        } else if (mdle instanceof GroupModules.Module) {
            return new GroupNode(nodeId, mdle, childrenNodes)
        } else if (mdle instanceof PluginFlux) {
            // This module can't have plugins and has no content
            return new PluginNode(nodeId, mdle)
        } else if (mdle instanceof ModuleFlux) {
            // If there is no plugins, and since this module is not a Group, we don't pass an empty array to the
            // constructor because this would create an empty list of children nodes for this node
            return childrenNodes.length != 0
                ? new ModuleNode(nodeId, mdle, childrenNodes)
                : new ModuleNode(nodeId, mdle)
        } else {
            throw new Error(
                'Unknown module class for project tree view node creation',
            )
        }
    }

    /**
     * Maintain state for the {@link View}.
     * - Update the tree using the {@link ProjectManager|projectManager} observable for
     *   {@link ProjectManager.projectUpdated$|project update}.
     * - Update selected node using the {@link ProjectManager|projectManager} observable for
     *   {@link ProjectManager.moduleSelected$|module selection}.
     * - Update selected {@link ModuleFlux|module} selected in the {@link ProjectManager|projectManager} by calling
     *   {@link ProjectManager.modulesSelected|projectManager.modulesSelected()}.
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
        /* The ProjectManager */
        public readonly projectManager: ProjectManager

        private readonly nodeIdBuilder: NodeIdBuilder

        /**
         * Convenient method to easily instantiate a State
         *
         * @param projectManager an implementation of {@link ProjectManager}
         * @param uniq the string use to generate unique {@link ModuleNode|node} id from {@link ModuleFlux|module} id
         * (See {@link nodeIdBuilderForUniq})
         *
         * @category Construction
         *
         */
        static stateForProjectManagerAndUniq(
            projectManager: ProjectManager,
            uniq: string,
        ): State {
            const nodeIdBuilder = nodeIdBuilderForUniq(uniq)
            return new State(projectManager, nodeIdBuilder)
        }

        /**
         * Constructor from ProjectManager
         * - build the root node with {@link rootFactory})
         * - connect subscriptions to projectManager
         *
         * @category Construction
         *
         * @param projectManager
         * @param nodeIdBuilder
         *
         */
        private constructor(
            projectManager: ProjectManager,
            nodeIdBuilder: NodeIdBuilder,
        ) {
            super({
                rootNode: rootFactory(
                    projectManager.workflow(),
                    nodeIdBuilder,
                    projectManager.filterNode,
                ),
                expandedNodes: [nodeIdBuilder.buildForRootComponent()],
            })
            this.projectManager = projectManager
            this.nodeIdBuilder = nodeIdBuilder
            this.subscribe()
        }

        /**
         * Create {@link Subscription|subscriptions} and store them in {@link State.projectTreeSubscriptions}.
         *
         * - {@link ProjectManager|projectManager}’s {@link AppObservables.projectUpdated$|project update}
         *   => {@link State.updateTree()}
         * - {@link ProjectManager|projectManager}’s {@link AppObservables.moduleSelected$|module selection}
         *   => {@link State.selectNodeRepresentingModule()}
         * - parent’s {@link ImmutableTree.State.selectedNode$|node selection}
         *   => {@link ProjectManager.modulesSelected|projectManager.moduleSelected()}
         *
         * @category Subscriptions
         *
         */
        private subscribe() {
            this.projectTreeSubscriptions.push(
                // WHEN App project change UPDATE Tree
                this.projectManager.projectUpdated$.subscribe((delta) =>
                    this.updateTree(delta),
                ),

                // WHEN App selected module change UPDATE Tree selected node
                this.projectManager.moduleSelected$.subscribe((mdle) =>
                    this.selectNodeRepresentingModule(mdle),
                ),

                // WHEN Tree selected node change UPDATE APP selected module
                // EXCEPT If module already selected
                //       OR node is root component
                this.selectedNode$
                    // get id from node and ensure module is not already selected and is not root Component
                    .pipe(
                        // node => moduleId
                        map((node) => node.getModuleId()),
                        // filter from projectManager
                        filter((v) => this.projectManager.filterSelection(v)),
                    )
                    .subscribe((id) => this.projectManager.selectModule(id)),
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
            this.projectTreeSubscriptions.splice(
                0,
                this.projectTreeSubscriptions.length,
            )
            super.unsubscribe()
        }

        /**
         * Select the {@link ModuleNode|node} representing a given {@link ModuleFlux|module}
         *
         * To be called When {@link ProjectManager|projectManager} module selection change
         *
         * @category Subscriptions
         *
         */
        private selectNodeRepresentingModule(mdle: ModuleFlux) {
            selectNodeAndExpand(
                this,
                this.getNode(this.nodeIdBuilder.buildForModule(mdle)),
            )
        }

        /**
         * Update tree.
         *
         * To be called when {@link ProjectManager|projectManager} project update.
         *
         * TODO: effectively use delta from {@link AppObservables.projectUpdated$}, currently
         * calling {@link ImmutableTree.State.reset|reset()}
         *
         * @category Subscriptions
         *
         */
        private updateTree(_delta: WorkflowDelta) {
            this.reset(
                rootFactory(
                    this.projectManager.workflow(),
                    this.nodeIdBuilder,
                    this.projectManager.filterNode,
                ),
            )
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
        const vDomClasses =
            'project-tree-node d-flex fv-pointer align-items-center'

        // Root node is a special case («play» icon, bigger font, use project name)
        if (node.getModuleId() == Component.rootComponentId) {
            return {
                class: vDomClasses,
                children: [
                    { class: 'p-0 mx-2 fas fa-play' },
                    { innerText: `${state.projectManager.name()}` },
                ],
            }
        }

        // fontAwesome icon for this node
        let faClass
        if (node instanceof ComponentNode) {
            // Order DOES matter (ComponentNode is also a GroupNode)
            faClass = 'fa-cube'
        } else if (node instanceof GroupNode) {
            faClass = 'fa-object-group'
        } else if (node instanceof PluginNode) {
            faClass = 'fa-puzzle-piece'
        }
        // fatClass might be left undefined (i.e. no icon)

        return {
            class: vDomClasses,
            style: { fontSize: 'smaller' },
            children: [
                { class: faClass ? `mx-2 fas ${faClass}` : '' },
                { innerText: node.getModuleTitle() },
            ],
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
    export class View extends ImmutableTree.View<ModuleNode> {
        class = 'h-100 overflow-auto'
        disconnectedCallback: (elem) => void

        constructor({ state, ...others }: { state: State }) {
            super({ state: state, headerView: nodeHeaderView, ...others })
            this.disconnectedCallback = () =>
                (this.state as State).unsubscribe()
        }
    }
}
