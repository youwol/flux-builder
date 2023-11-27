import {
    BuilderRendering,
    Component,
    GroupModules,
    IEnvironment,
    ModuleConfiguration,
    ModuleFlux,
    ModuleView,
    Project,
    uuidv4,
    Workflow,
} from '@youwol/flux-core'
import { Observable } from 'rxjs'
import { AppDebugEnvironment, LogLevel } from '.'

export function getGroup(
    workflow: Workflow,
    parentGroup: GroupModules.Module,
    group: GroupModules.Module,
    id: string,
): [GroupModules.Module, GroupModules.Module] {
    if (group.moduleId === id) {
        return [group, parentGroup]
    }

    let found = undefined
    const groups = group
        .getDirectChildren(workflow)
        .filter((mdle) => mdle instanceof GroupModules.Module)

    for (const mdle of groups) {
        const element = getGroup(
            workflow,
            group,
            mdle as GroupModules.Module,
            id,
        )
        if (element) {
            found = element
            break
        }
    }

    return found
}

export function createGroup(
    title: string,
    modules: Array<ModuleFlux>,
    project: Project,
    currentLayerId: string,
    Factory,
    configuration,
    workflow$: Observable<Workflow>,
    environment: IEnvironment,
): { project: Project } {
    const debugSingleton = AppDebugEnvironment.getInstance()
    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: 'createLayer',
            object: {
                modules: modules,
                title: title,
            },
        })

    const modulesId = modules.map((mdle) => mdle.moduleId)

    const newGrpMdle = new Factory.Module({
        moduleId: Factory.id.replace('@', '_') + '_' + uuidv4(),
        configuration: new ModuleConfiguration({
            title,
            description: '',
            data: new Factory.PersistentData({
                moduleIds: modules.map((m) => m.moduleId),
            }),
        }),
        Factory: Factory,
        workflow$,
        environment,
    })
    const parentGroup = project.workflow.modules.find(
        (mdle) => mdle.moduleId == currentLayerId,
    ) as GroupModules.Module
    const parentGroupUpdated = updateGroup(parentGroup, {
        moduleIds: parentGroup
            .getModuleIds()
            .filter((mId) => !modulesId.includes(mId))
            .concat(newGrpMdle.moduleId),
    })

    const workflow = new Workflow({
        modules: project.workflow.modules
            .filter((mdle) => mdle.moduleId != parentGroup.moduleId)
            .concat(newGrpMdle, parentGroupUpdated),
        connections: project.workflow.connections,
        plugins: project.workflow.plugins,
    })

    const moduleViewsInGrp = project.builderRendering.modulesView.filter(
        (view) => newGrpMdle.getModuleIds().includes(view.moduleId),
    )

    const xWorld =
        moduleViewsInGrp.reduce((acc, e) => acc + e.xWorld, 0) /
        moduleViewsInGrp.length
    const yWorld =
        moduleViewsInGrp.reduce((acc, e) => acc + e.yWorld, 0) /
        moduleViewsInGrp.length
    const moduleView = new ModuleView(
        newGrpMdle.moduleId,
        xWorld,
        yWorld,
        Factory,
    )
    const moduleViews = [...project.builderRendering.modulesView, moduleView]

    const projectNew = new Project({
        ...project,
        ...{
            workflow,
            builderRendering: new BuilderRendering(
                moduleViews,
                project.builderRendering.connectionsView,
                project.builderRendering.descriptionsBoxes,
            ),
        },
    })

    return { project: projectNew }
}

export function updateGroup(
    original: GroupModules.Module,
    persistentFields: any,
): GroupModules.Module {
    const persistentData = new original.Factory.PersistentData({
        ...original.getPersistentData(),
        ...persistentFields,
    })
    const grpConfiguration = new ModuleConfiguration({
        ...original.configuration,
        data: persistentData,
    })
    const groupModuleNew = new original.Factory.Module(
        Object.assign({}, original, { configuration: grpConfiguration }),
    )
    return groupModuleNew
}

export function updateComponent(
    original: Component.Module,
    persistentFields: any,
): Component.Module {
    return updateGroup(original, persistentFields) as Component.Module
}

export function getDisplayedModulesView(
    group: GroupModules.Module,
    parentGroup: GroupModules.Module | undefined,
    appStore,
    project: Project,
) {
    const modulesId = group.getModuleIds()
    const unitModulesView = project.builderRendering.modulesView.filter(
        (moduleView) => modulesId.includes(moduleView.moduleId),
    )
    let parentUnitModulesView = []
    if (parentGroup) {
        const modulesId = parentGroup.getModuleIds()
        parentUnitModulesView = project.builderRendering.modulesView.filter(
            (moduleView) => modulesId.includes(moduleView.moduleId),
        )
    }
    return {
        parentLayer: {
            modulesView: parentUnitModulesView.filter(
                (mView) => !mView.moduleId.includes(group.moduleId),
            ),
            modules: parentUnitModulesView.map((view) =>
                appStore.getModule(view.moduleId),
            ),
            currentGroupModuleView: parentUnitModulesView.find((mView) =>
                mView.moduleId.includes(group.moduleId),
            ),
        },
        currentLayer: {
            modulesView: unitModulesView,
            modules: unitModulesView.map((view) =>
                appStore.getModule(view.moduleId),
            ),
        },
    }
}
