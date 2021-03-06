/** @format */

import {
    BuilderRendering,
    Component,
    Connection,
    createProject,
    DescriptionBox,
    DescriptionBoxProperties,
    FluxExtensionAPIs,
    getCollectionsDelta,
    GroupModules,
    IEnvironment,
    instanceOfSideEffects,
    loadProjectDatabase$,
    loadProjectDependencies$,
    loadProjectURI$,
    ModuleConfiguration,
    ModuleFlux,
    PluginFlux,
    Project,
    ProjectSchema,
    Requirements,
    Workflow,
    workflowDelta,
} from '@youwol/flux-core'
import * as _ from 'lodash'
import { Observable, ReplaySubject } from 'rxjs'
import { filter, map, mergeMap, tap } from 'rxjs/operators'
import { AppDebugEnvironment, LogLevel } from './app-debug.environment'
import { AppExtensionsObservables } from './app-extensions-observables.service'

import { AppObservables } from './app-observables.service'
import {
    addAdaptor,
    addConnection,
    deleteAdaptor,
    deleteConnection,
    setConnectionView,
    subscribeConnections,
    updateAdaptor,
} from './app-store-connections'
import { addLibraries, cleanUnusedLibraries } from './app-store-dependencies'

import {
    addDescriptionBox,
    deleteDescriptionBox,
    updateDescriptionBox,
} from './app-store-description-box'

import {
    addModule,
    alignH,
    alignV,
    deleteModules,
    duplicateModules,
    moveModules,
    updateModule,
} from './app-store-modules'

import {
    createGroup,
    getDisplayedModulesView,
    getGroup,
} from './app-store-modules-group'
import { addPlugin, getAvailablePlugins, getPlugins } from './app-store-plugins'
import {
    setRenderingLayout,
    setRenderingStyle,
} from './app-store-runner-rendering'
import { BuilderStateAPI } from './extension'
import { toProjectData, toProjectURI } from './factory-utils'
import { AppBuildViewObservables } from './observables-plotters'
import { packageAssetComponent, plugBuilderViewsSignals, uuidv4 } from './utils'

export interface BackendInterface {
    getAdaptors()
    getProject(id: string)
    postProject(id: string, body: Object)
    postAdaptor(body: Object)
}

export class AppStore {
    private static instance: AppStore = undefined

    static getInstance(environment: IEnvironment) {
        if (!AppStore.instance) {
            AppStore.instance = new AppStore(
                environment,
                AppObservables.getInstance(),
                AppBuildViewObservables.getInstance(),
            )
        }
        return AppStore.instance
    }
    debugSingleton = AppDebugEnvironment.getInstance()

    builderViewsActions = {
        configurationUpdated: (data) =>
            this.updateModule(data.module, data.configuration),
    }
    allSubscriptions = new Map<Connection, any>()

    projectId = undefined
    project: Project
    workflow$ = new ReplaySubject<Workflow>(1)

    rootComponentId = 'Component_root-component'
    activeGroupId: string = this.rootComponentId
    adaptors = []
    history: Array<Project>
    indexHistory = 0

    modulesFactory: Map<string, any>
    pluginsFactory: Map<string, any>
    packages = []

    implicitModules: Array<ModuleFlux> = []
    moduleSelected: ModuleFlux = undefined
    modulesSelected: Array<ModuleFlux> = []
    connectionSelected: Connection = undefined
    descriptionBoxSelected: DescriptionBox = undefined

    appExtensionsObservables: AppExtensionsObservables =
        AppExtensionsObservables.getInstance()

    constructor(
        public readonly environment: IEnvironment,
        public appObservables: AppObservables,
        public appBuildViewObservables: AppBuildViewObservables,
    ) {
        this.environment = environment
        const html = `<div id='${this.rootComponentId}' class='flux-element flux-component'></div>`
        this.project = new Project({
            name: 'new project',
            schemaVersion: '1.0',
            description: '',
            requirements: new Requirements([], [], {}, {}),
            workflow: new Workflow({
                modules: [
                    new Component.Module({
                        workflow$: this.workflow$,
                        staticStorage: {},
                        moduleId: this.rootComponentId,
                        configuration: new ModuleConfiguration({
                            title: 'root-component',
                            description: '',
                            data: new Component.PersistentData({
                                html,
                            }),
                        }),
                        Factory: Component,
                        environment: environment,
                    }),
                ],
                connections: [],
                plugins: [],
            }),
            builderRendering: new BuilderRendering([], [], []),
        })
        this.history = new Array<Project>(this.project)
        this.debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: 'AppStore constructed',
            object: { appStore: this },
        })

        GroupModules['BuilderView'].notifier$
            .pipe(filter((event: any) => event.type == 'groupFocused'))
            .subscribe((d) => this.selectActiveGroup(d.data))
        Component['BuilderView'].notifier$
            .pipe(filter((event: any) => event.type == 'groupFocused'))
            .subscribe((d) => this.selectActiveGroup(d.data))
        GroupModules['BuilderView'].notifier$
            .pipe(filter((event: any) => event.type == 'closeLayer'))
            .subscribe((d) =>
                this.selectActiveGroup(this.getParentGroup(d.data).moduleId),
            )
        Component['BuilderView'].notifier$
            .pipe(filter((event: any) => event.type == 'closeLayer'))
            .subscribe((d) =>
                this.selectActiveGroup(this.getParentGroup(d.data).moduleId),
            )
        this.appObservables.renderingLoaded$.next({
            style: '',
            layout: '',
            cssLinks: [],
        })
    }
    //
    // setUiState(view) {
    //     this.debugSingleton.debugOn &&
    //         this.debugSingleton.logWorkflowBuilder({
    //             level: LogLevel.Info,
    //             message: 'ui state updated',
    //             object: { state: view },
    //         })
    //
    //     this.uiState = showView(view, this.uiState)
    //     this.appObservables.uiStateUpdated$.next(this.uiState)
    // }

    loadProject(
        projectId: string,
        project: ProjectSchema,
        onEvent?: (CdnEvent) => void,
    ) {
        this.projectId = projectId
        const project$ = loadProjectDependencies$(
            project,
            this.environment,
            onEvent,
        ).pipe(
            map(({ project, packages }) => {
                return createProject(
                    project,
                    packages,
                    this.workflow$,
                    this.allSubscriptions,
                    this.environment,
                )
            }),
        )

        this.initializeProject(project$)
    }

    loadProjectId(projectId: string) {
        this.projectId = projectId

        const project$ = loadProjectDatabase$(
            projectId,
            this.workflow$,
            this.allSubscriptions,
            this.environment,
        )
        this.initializeProject(project$)
    }

    loadProjectURI(projectURI: string) {
        this.projectId = undefined
        const project$ = loadProjectURI$(
            projectURI,
            this.workflow$,
            this.allSubscriptions,
            this.environment,
        )
        this.initializeProject(project$)
    }

    initializeProject(
        project$: Observable<{ project: Project; packages: Array<any> }>,
    ) {
        project$.subscribe(
            ({
                project,
                packages,
            }: {
                project: Project
                packages: Array<any>
            }) => {
                this.appObservables.packagesUpdated$.next(packages)
                const rootComponent = project.workflow.modules.find(
                    (mdle) => mdle.moduleId == this.rootComponentId,
                ) as Component.Module
                this.activeGroupId = rootComponent.moduleId

                this.debugSingleton.debugOn &&
                    this.debugSingleton.logWorkflowBuilder({
                        level: LogLevel.Info,
                        message: 'project created',
                        object: { project: this.project },
                    })
                this.updateProject(project)

                this.loadExtensions()

                this.appObservables.ready$.next(true)
                this.appObservables.packagesLoaded$.next()

                const layout = rootComponent.getFullHTML(project.workflow)
                const style = rootComponent.getFullCSS(project.workflow, {
                    asString: true,
                })
                this.appObservables.renderingLoaded$.next({
                    style,
                    layout,
                    cssLinks: [],
                })
                this.unselect()
            },
        )
    }

    loadExtensions() {
        // this test is for backward compatibility w/ flux-lib-core
        if (!FluxExtensionAPIs) {
            return
        }
        BuilderStateAPI.initialize(this)
        FluxExtensionAPIs.registerAPI('BuilderState', BuilderStateAPI)
    }

    addLibraries$(
        libraries: Array<{ name: string; version: string; namespace: string }>,
        fluxPacks: Array<{ name: string }>,
    ) {
        return addLibraries(
            libraries,
            fluxPacks,
            this.project,
            this.environment,
        ).pipe(
            tap((newProject) => {
                this.updateProject(newProject)
            }),
        )
    }

    projectSchema$(): Observable<ProjectSchema> {
        return cleanUnusedLibraries(this.project, this.environment).pipe(
            map((project) => toProjectData(project)),
        )
    }

    projectURI$(): Observable<string> {
        return this.projectSchema$().pipe(
            map((project) => {
                return `/applications/@youwol/flux-builder/latest/?uri=${toProjectURI(
                    project,
                )}`
            }),
        )
    }

    saveProject() {
        this.projectSchema$()
            .pipe(
                mergeMap((body) =>
                    this.environment
                        .postProject(this.projectId, body)
                        .pipe(map(() => body)),
                ),
            )
            .subscribe((body) => {
                this.debugSingleton.debugOn &&
                    this.debugSingleton.logWorkflowBuilder({
                        level: LogLevel.Info,
                        message: 'project saved',
                        object: { body, project: this.project },
                    })
            })
    }

    getModulesFactory() {
        return this.packages
            .map((p) =>
                Object.entries(p.modules).map(([_, mdle]: [any, any]) => [
                    `${mdle.id}@${p.id}`,
                    mdle,
                ]),
            )
            .reduce((acc, e) => acc.concat(e), [])
            .reduce(
                (acc, e: [string, any]) => _.merge(acc, { [e[0]]: e[1] }),
                {},
            )
    }

    getAvailablePlugins(mdle) {
        return getAvailablePlugins(mdle, this.pluginsFactory)
    }

    getPlugins(moduleId): Array<PluginFlux<any>> {
        return getPlugins(moduleId, this.project)
    }

    addPlugin(Factory, parentModule): ModuleFlux {
        const project = addPlugin(
            Factory,
            parentModule,
            this.project,
            this.appObservables.ready$,
            this.environment,
        )
        this.updateProject(project)
        return project.workflow.plugins.slice(-1)[0]
    }

    addModule(moduleFactory, coors = [0, 0]) {
        const project = addModule(
            moduleFactory,
            coors,
            this.project,
            this.activeGroupId,
            this.appObservables.ready$,
            this.environment,
        )
        this.updateProject(project)
    }

    updateModule(
        mdle: ModuleFlux,
        configuration: ModuleConfiguration,
        unselect = true,
    ) {
        const project = updateModule(
            mdle,
            configuration,
            this.project,
            this.allSubscriptions,
            this.appObservables.ready$,
        )
        if (unselect) {
            this.unselect()
        }
        this.updateProject(project)
    }

    duplicateModules(modules: Array<ModuleFlux>) {
        const project = duplicateModules(
            modules,
            this.project,
            this.appObservables.ready$,
        )
        this.updateProject(project)
    }

    alignH(modules: Array<ModuleFlux>) {
        const project = alignH(
            modules.map((m) => m.moduleId),
            this.project,
            this.appObservables.ready$,
        )
        this.updateProject(project)
    }

    alignV(modules: Array<ModuleFlux>) {
        const project = alignV(
            modules.map((m) => m.moduleId),
            this.project,
            this.appObservables.ready$,
        )
        this.updateProject(project)
    }

    moveModules(modulesPosition) {
        modulesPosition = modulesPosition.filter((m) =>
            this.getActiveGroup().getModuleIds().includes(m.moduleId),
        )
        const project = moveModules(
            modulesPosition,
            this.project.builderRendering.modulesView,
            this.project,
            this.implicitModules,
        )
        this.updateProject(project)
    }

    getModuleSelected(): ModuleFlux {
        if (this.moduleSelected) {
            return this.moduleSelected
        }
        if (this.modulesSelected.length == 1) {
            return this.modulesSelected[0]
        }
        return undefined
    }

    getModulesSelected(): Array<ModuleFlux> {
        if (this.moduleSelected) {
            return [this.moduleSelected]
        }
        if (this.modulesSelected.length > 0) {
            return this.modulesSelected
        }

        return []
    }

    isSelected(moduleId: string) {
        if (this.moduleSelected && this.moduleSelected.moduleId === moduleId) {
            return true
        }

        if (
            this.modulesSelected &&
            this.modulesSelected.find((m) => m.moduleId === moduleId)
        ) {
            return true
        }

        return false
    }

    selectModule(moduleId: string, focus = false) {
        if (
            this.modulesSelected.find((m) => m.moduleId == moduleId) ||
            (this.moduleSelected && this.moduleSelected.moduleId == moduleId)
        ) {
            return
        }

        if (this.moduleSelected && this.moduleSelected.moduleId != moduleId) {
            this.appObservables.modulesUnselected$.next([this.moduleSelected])
            this.moduleSelected = undefined
        }

        if (!this.modulesSelected.find((m) => m.moduleId == moduleId)) {
            this.appObservables.modulesUnselected$.next(this.modulesSelected)
            this.modulesSelected = []
        }

        this.moduleSelected = this.getModule(moduleId)
        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'module selected',
                object: { module: this.moduleSelected },
            })
        this.appObservables.moduleSelected$.next(this.moduleSelected)
        if (focus && this.activeGroupId != this.moduleSelected.moduleId) {
            this.selectActiveGroup(this.getParentGroup(moduleId).moduleId)
        }
    }

    selectConnection(connection: Connection | string) {
        this.unselect()
        this.connectionSelected =
            connection instanceof Connection
                ? connection
                : this.getConnection(connection)
        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'connection selected',
                object: { module: this.connectionSelected },
            })
        this.appObservables.connectionSelected$.next(this.connectionSelected)
        const moduleFrom = this.getModule(
            this.connectionSelected.start.moduleId,
        )
        const moduleTo = this.getModule(this.connectionSelected.end.moduleId)
        const suggestions = this.adaptors.filter(
            (a) =>
                a.fromModuleFactoryId === moduleFrom['factoryId'] &&
                a.toModuleFactoryId === moduleTo['factoryId'] &&
                a.fromModuleSlotId === this.connectionSelected.start.slotId &&
                a.toModuleSlotId === this.connectionSelected.end.slotId,
        )
        if (!this.connectionSelected.adaptor) {
            this.appObservables.suggestions$.next(suggestions)
        }
    }

    select({
        modulesId,
        connectionsId,
    }: {
        modulesId: Array<string>
        connectionsId: Array<Connection>
    }) {
        this.unselect()
        this.modulesSelected = this.project.workflow.modules.filter((m) =>
            modulesId.includes(m.moduleId),
        )
        this.modulesSelected.forEach((m) =>
            this.appObservables.moduleSelected$.next(m),
        )
    }

    getModuleOrPlugin(moduleId: string): ModuleFlux {
        const allModules = this.getModulesAndPlugins()
        const m = allModules.find((m) => m.moduleId === moduleId)
        return m
    }

    getModule(moduleId: string): ModuleFlux {
        let m = this.getModulesAndPlugins().find((m) => m.moduleId === moduleId)
        if (m) {
            return m
        }
        m = this.implicitModules.find((m) => m.moduleId === moduleId)
        return m
    }

    deleteModules(modulesDeleted: Array<ModuleFlux>) {
        this.unselect()
        const project = deleteModules(modulesDeleted, this.project)
        if (!project) {
            return
        }
        const rootComponent = project.workflow.modules.find(
            (mdle) => mdle.moduleId == this.rootComponentId,
        ) as Component.Module

        if (
            !getGroup(
                project.workflow,
                rootComponent,
                rootComponent,
                this.activeGroupId,
            )
        ) {
            // if the group has been deleted => we focus on the root-component
            const oldLayer = this.activeGroupId
            this.activeGroupId = this.rootComponentId
            this.updateProject(project)
            this.appObservables.activeLayerUpdated$.next({
                fromLayerId: oldLayer,
                toLayerId: this.activeGroupId,
            })
            return
        }
        this.updateProject(project)
    }

    deleteModule(mdle: ModuleFlux) {
        if (mdle == this.moduleSelected) {
            this.unselect()
        }
        this.deleteModules([mdle])
    }

    getActiveGroup(): GroupModules.Module {
        return getGroup(
            this.project.workflow,
            undefined,
            this.getModule(this.rootComponentId) as Component.Module,
            this.activeGroupId,
        )[0]
    }

    getRootComponent(): Component.Module {
        return getGroup(
            this.project.workflow,
            undefined,
            this.getModule(this.rootComponentId) as Component.Module,
            this.rootComponentId,
        )[0] as Component.Module
    }

    getGroup(groupId: string): GroupModules.Module {
        const a = getGroup(
            this.project.workflow,
            undefined,
            this.getModule(this.rootComponentId) as Component.Module,
            groupId,
        )
        if (a == undefined) {
            console.error('Can not find group ', groupId)
            return undefined
        }
        return a[0]
    }

    selectActiveGroup(moduleId: string) {
        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'selectActiveLayer',
                object: {
                    groupId: moduleId,
                },
            })
        if (this.activeGroupId == moduleId) {
            return
        }
        const oldLayerId = this.activeGroupId
        this.activeGroupId = moduleId
        this.appBuildViewObservables.modulesViewUpdated$.next(
            this.getActiveModulesView(),
        )
        this.appObservables.descriptionsBoxesUpdated$.next(
            this.project.builderRendering.descriptionsBoxes,
        )
        this.appObservables.activeLayerUpdated$.next({
            fromLayerId: oldLayerId,
            toLayerId: moduleId,
        })
    }

    getActiveModulesId() {
        return this.getGroup(this.activeGroupId).getModuleIds()
    }

    getActiveModulesView() {
        //deprecated, use getDisplayedModulesView, need to remove from tests
        const displayed = this.getDisplayedModulesView()
        return [
            ...displayed.currentLayer.modulesView,
            ...displayed.parentLayer.modulesView,
        ]
    }

    getDisplayedModulesView() {
        const [activeGroup, parentGroup] = getGroup(
            this.project.workflow,
            undefined,
            this.getModule(this.rootComponentId) as Component.Module,
            this.activeGroupId,
        )
        return getDisplayedModulesView(
            activeGroup,
            parentGroup,
            this,
            this.project,
        )
    }

    getGroupModule(groupId: string): GroupModules.Module {
        return this.project.workflow.modules.find(
            (m) => m instanceof GroupModules.Module && m.moduleId == groupId,
        ) as GroupModules.Module
    }

    getParentGroup(moduleId: string): GroupModules.Module {
        let mdle = this.getModule(moduleId)
        if (
            this.project.workflow.plugins
                .map((plugin) => plugin.moduleId)
                .includes(mdle.moduleId)
        ) {
            mdle = (mdle as PluginFlux<any>).parentModule
        }

        return this.project.workflow.modules
            .filter((mdle) => mdle instanceof GroupModules.Module)
            .find((grp: GroupModules.Module) =>
                grp.getModuleIds().includes(mdle.moduleId),
            ) as GroupModules.Module
    }

    getModulesAndPlugins(): Array<ModuleFlux> {
        return this.project.workflow.modules.concat(
            this.project.workflow.plugins,
        )
    }

    getConnection(connectionId: string): Connection {
        const c = this.project.workflow.connections.find(
            (c) => c.connectionId === connectionId,
        )
        return c
    }

    addConnection(connection: Connection) {
        const project = addConnection(
            connection,
            this.project,
            this.allSubscriptions,
        )

        this.updateProject(project)
        this.unselect()
        this.appObservables.connectionsUpdated$.next(
            this.project.workflow.connections,
        )
    }

    setConnectionView(connection: Connection, properties, unselect = true) {
        const project = setConnectionView(connection, properties, this.project)
        this.updateProject(project)
        if (unselect) {
            this.unselect()
        }
        this.appObservables.connectionsUpdated$.next(
            this.project.workflow.connections,
        )
    }

    getConnectionSelected() {
        return this.connectionSelected
    }

    getConnectionView(connectionId: string) {
        return this.project.builderRendering.connectionsView.find(
            (c) => c.connectionId == connectionId,
        )
    }

    deleteConnection(connection: Connection) {
        if (this.connectionSelected === connection) {
            this.connectionSelected = undefined
            this.appObservables.unselect$.next()
        }
        const project = deleteConnection(
            connection,
            this.project,
            this.allSubscriptions,
        )
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(
            this.project.workflow.connections,
        )
    }

    addAdaptor(adaptor, connection: Connection) {
        const project = addAdaptor(
            connection,
            adaptor,
            this.project,
            this.allSubscriptions,
        )
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(
            this.project.workflow.connections,
        )
    }

    deleteAdaptor(connection: Connection) {
        const project = deleteAdaptor(
            connection,
            this.project,
            this.allSubscriptions,
        )
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(
            this.project.workflow.connections,
        )
    }

    updateAdaptor(connection: Connection, mappingFunction: string) {
        const project = updateAdaptor(
            connection,
            mappingFunction,
            this.project,
            this.allSubscriptions,
        )
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(
            this.project.workflow.connections,
        )
    }

    unselect() {
        this.modulesSelected = []
        this.moduleSelected = undefined
        this.connectionSelected = undefined
        this.descriptionBoxSelected = undefined
        this.appObservables.unselect$.next()
        this.appObservables.suggestions$.next([])
    }

    deleteSelected() {
        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'delete selected',
                object: {
                    connectionSelected: this.connectionSelected,
                    moduleSelected: this.moduleSelected,
                    modulesSelected: this.modulesSelected,
                    descriptionBoxSelected: this.descriptionBoxSelected,
                },
            })
        if (this.connectionSelected) {
            this.deleteConnection(this.connectionSelected)
        }
        if (this.moduleSelected) {
            this.deleteModule(this.moduleSelected)
        }
        if (this.modulesSelected && this.modulesSelected.length > 0) {
            this.deleteModules(this.modulesSelected)
        }
        if (this.descriptionBoxSelected) {
            this.deleteDescriptionBox(this.descriptionBoxSelected)
        }
        this.appObservables.suggestions$.next([])
    }

    addGroup(moduleIds: Array<string>) {
        const dBox = new DescriptionBox(
            uuidv4(),
            'grouped module',
            moduleIds,
            '',
            new DescriptionBoxProperties(undefined),
        )
        const config = new GroupModules['Configuration']({ title: dBox.title })
        const { project } = createGroup(
            dBox.title,
            dBox.modulesId.map((mid) => this.getModule(mid)),
            this.project,
            this.activeGroupId,
            GroupModules,
            config,
            this.workflow$,
            this.environment,
        )
        this.updateProject(project)
    }

    addComponent(moduleIds: Array<string>) {
        const dBox = new DescriptionBox(
            uuidv4(),
            'component',
            moduleIds,
            '',
            new DescriptionBoxProperties(undefined),
        )
        const config = new Component['Configuration']({ title: dBox.title })
        const { project } = createGroup(
            dBox.title,
            dBox.modulesId.map((mid) => this.getModule(mid)),
            this.project,
            this.activeGroupId,
            Component,
            config,
            this.workflow$,
            this.environment,
        )
        this.updateProject(project)
    }

    setRenderingLayout(layout, asNewState = true) {
        const project = setRenderingLayout(layout, this.project)
        this.updateProject(project, asNewState)
    }

    setRenderingStyle(style, asNewState = true) {
        const rootComponent = this.getGroup(
            this.rootComponentId,
        ) as Component.Module

        const project = setRenderingStyle(rootComponent, style, this.project)
        if (project != this.project) {
            this.updateProject(project, asNewState)
        }
    }

    addDescriptionBox(descriptionBox: DescriptionBox) {
        const project = addDescriptionBox(descriptionBox, this.project)
        this.updateProject(project)
        this.appObservables.descriptionsBoxesUpdated$.next(
            this.project.builderRendering.descriptionsBoxes,
        )
    }

    selectDescriptionBox(descriptionBoxId) {
        this.unselect()
        this.descriptionBoxSelected =
            this.project.builderRendering.descriptionsBoxes.find(
                (b) => b.descriptionBoxId == descriptionBoxId,
            )
        this.appObservables.descriptionsBoxesUpdated$.next(
            this.project.builderRendering.descriptionsBoxes,
        )
    }

    updateDescriptionBox(descriptionBox) {
        this.unselect()
        const project = updateDescriptionBox(descriptionBox, this.project)
        this.updateProject(project)
        this.appObservables.descriptionsBoxesUpdated$.next(
            this.project.builderRendering.descriptionsBoxes,
        )
    }

    deleteDescriptionBox(descriptionBox) {
        if (descriptionBox == this.descriptionBoxSelected) {
            this.unselect()
        }
        const project = deleteDescriptionBox(descriptionBox, this.project)
        this.updateProject(project)

        this.appObservables.descriptionsBoxesUpdated$.next(
            this.project.builderRendering.descriptionsBoxes,
        )
    }

    updateProjectToIndexHistory(indexHistory, oldIndex) {
        const updatesDone = {
            modules: false,
            modulesView: false,
            connections: false,
            activeLayer: false,
            descriptionBox: false,
        }
        this.indexHistory = indexHistory
        this.project = this.history[this.indexHistory]
        const oldProject = this.history[oldIndex]

        const delta = workflowDelta(oldProject.workflow, this.project.workflow)

        if (delta.modules.removedElements) {
            delta.modules.removedElements
                .filter((m) => instanceOfSideEffects(m))
                .forEach((m) => (m as any).dispose())
        }

        // the synchronization of the modules 'workflowDependantTrait' are done:
        //  - after the deleted modules 'disposed': the module depending on workflow$
        // will dispose before an eventually inconsistent wf is emitted
        //  - before the new modules eventually 'applied': the modules depending on workflow$
        // will apply using a consistent workflow (ReplaySubject is used for workflow)
        //  - before updates signals are send
        if (delta.hasDiff) {
            this.workflow$.next(this.project.workflow)
        }

        if (delta.modules.createdElements) {
            plugBuilderViewsSignals(
                delta.modules.createdElements,
                this.builderViewsActions,
                this.appBuildViewObservables.notification$,
            )
            delta.modules.createdElements
                .filter((m) => instanceOfSideEffects(m))
                .forEach((m) => (m as any).apply())
        }

        if (
            !updatesDone.modules &&
            (delta.modules.createdElements.length > 0 ||
                delta.modules.removedElements.length > 0)
        ) {
            this.appObservables.modulesUpdated$.next(delta.modules)
            this.appBuildViewObservables.modulesViewUpdated$.next(
                this.getActiveModulesView(),
            )
            updatesDone.modules = true
            updatesDone.modulesView = true
        }
        if (
            !updatesDone.connections &&
            (delta.connections.createdElements.length > 0 ||
                delta.connections.removedElements.length > 0)
        ) {
            this.appObservables.connectionsUpdated$.next(
                this.project.workflow.connections,
            )
            updatesDone.connections = true
        }
        if (
            !updatesDone.modulesView &&
            this.project.builderRendering.modulesView !==
                oldProject.builderRendering.modulesView
        ) {
            const delta = getCollectionsDelta(
                oldProject.builderRendering.modulesView,
                this.project.builderRendering.modulesView,
            )
            const updates = [
                ...delta.createdElements.filter(
                    (e) =>
                        delta.removedElements.find(
                            (e2) => e2.moduleId == e.moduleId,
                        ) == undefined,
                ),
                ...delta.createdElements.filter(
                    (e) =>
                        delta.removedElements.find(
                            (e2) => e2.moduleId == e.moduleId,
                        ) == undefined,
                ),
            ]
            updates.length > 0
                ? this.appBuildViewObservables.modulesViewUpdated$.next(
                      this.getActiveModulesView(),
                  )
                : this.appObservables.connectionsUpdated$.next(
                      this.project.workflow.connections,
                  )
            if (updates.length > 0) {
                updatesDone.modulesView = true
            }
        }
        if (
            !updatesDone.activeLayer &&
            (this.activeGroupId != this.rootComponentId ||
                this.project.workflow.modules.find(
                    (m) => m.moduleId == this.rootComponentId,
                ) !=
                    oldProject.workflow.modules.find(
                        (m) => m.moduleId == this.rootComponentId,
                    ))
        ) {
            if (!updatesDone.modulesView) {
                this.appBuildViewObservables.modulesViewUpdated$.next(
                    this.getActiveModulesView(),
                )
            }
            this.appObservables.descriptionsBoxesUpdated$.next(
                this.project.builderRendering.descriptionsBoxes,
            )
            this.appObservables.activeLayerUpdated$.next({
                fromLayerId: undefined,
                toLayerId: this.activeGroupId,
            })
            updatesDone.activeLayer = true
        }
        if (
            !updatesDone.descriptionBox &&
            this.project.builderRendering.descriptionsBoxes !==
                oldProject.builderRendering.descriptionsBoxes
        ) {
            this.appObservables.descriptionsBoxesUpdated$.next(
                this.project.builderRendering.descriptionsBoxes,
            )
            updatesDone.descriptionBox = true
        }
        subscribeConnections(
            this.allSubscriptions,
            delta.connections,
            this.project.workflow.modules,
            this.project.workflow.plugins,
        )

        this.appObservables.projectUpdated$.next(delta)
        this.appExtensionsObservables.projectUpdated$.next(delta)

        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'updateProjectToIndexHistory',
                object: {
                    oldProject,
                    delta,
                    newProject: this.project,
                    history: this.history,
                    updatesDone,
                },
            })
    }

    undo() {
        if (this.indexHistory == 0) {
            return
        }
        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'undo',
                object: { history: this.history },
            })
        this.updateProjectToIndexHistory(
            this.indexHistory - 1,
            this.indexHistory,
        )
    }

    redo() {
        if (this.indexHistory == this.history.length - 1) {
            return
        }
        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'redo',
                object: { history: this.history },
            })
        this.updateProjectToIndexHistory(
            this.indexHistory + 1,
            this.indexHistory,
        )
    }

    updateProject(newProject: Project, asNewState = true) {
        if (!newProject) {
            return
        }
        const oldIndex = this.indexHistory
        if (!asNewState) {
            this.history = this.history.slice(0, -1)
            this.indexHistory--
        }
        if (this.indexHistory === this.history.length - 1) {
            this.history.push(newProject)
            this.indexHistory++
        }
        if (this.indexHistory < this.history.length - 1) {
            this.history = this.history.slice(0, this.indexHistory + 1)
            this.history.push(newProject)
            this.indexHistory = this.history.length - 1
        }
        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder({
                level: LogLevel.Info,
                message: 'updateProject',
                object: {
                    newProject: newProject,
                    history: this.history,
                },
            })
        this.updateProjectToIndexHistory(this.indexHistory, oldIndex)
    }
}
