import { LogLevel, AppDebugEnvironment } from './app-debug.environment'
import { uuidv4 } from './utils'
import {
    ModuleView, Workflow, BuilderRendering, Project, ModuleFlux, GroupModules,
    ModuleConfiguration, PluginFlux, Connection, DescriptionBox, IEnvironment
}
    from '@youwol/flux-core'
import { Subscription } from 'rxjs'
import { updateGroup } from './app-store-modules-group'

declare var _: any

export function defaultModuleRendering(mdle) {

    const div = <HTMLDivElement>(document.createElement('div'))
    div.setAttribute("id", mdle.moduleId)
    div.setAttribute("name", mdle.configuration.title)
    div.classList.add("flux-component")
    if (mdle.moduleId.includes("viewer3d"))
        {div.classList.add("fill-parent")}

    if (mdle.moduleId.includes("cesium"))
        {div.classList.add("fill-parent")}
    return div
}
export function isGroupingModule(moduleData) {
    return ["GroupModules@flux-pack-core", "Component@flux-pack-core"].includes(moduleData.factoryId)
}
/*
export function instantiateModules( modulesData, modulesFactory, appObservables : AppObservables,
     environment, workflowGetter ): Array<ModuleFlux>{

    let debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "instantiateModules", 
        object:{ modulesFactory: modulesFactory, modulesData:modulesData }
    })

    let modules = modulesData
    .map( moduleData => {
        let factoryKey = JSON.stringify(moduleData.factoryId)
        let Factory = modulesFactory.get(factoryKey)
        if(!Factory)
            throw Error(`Can not get factory ${factoryKey}`)
        let conf    = new Factory.Configuration({title:         moduleData.configuration.title,
                                                 description:   moduleData.configuration.description,
                                                 data:          new Factory.PersistentData(moduleData.configuration.data)
                                                })
        let data = Object.assign({},{
            moduleId:          moduleData.moduleId, 
            configuration:     conf, 
            ready$:            appObservables.ready$,
            Factory:           Factory,
            workflowGetter:    workflowGetter, // only relevant for Groups
            logger:            new ModuleLogger(debugSingleton),
            environment:       environment}, 
                isGroupingModule(moduleData) ? 
                {workflowGetter, layerId:moduleData.moduleId.split(Factory.id+"_")[1] } : {})
        
        let mdle  = new Factory.Module(data)                         
        return mdle 
    } ).filter(m => m)
    
    return modules
}
*/
export function addModule(Factory, coors, project: Project, activeLayerId: string, ready$: any, environment: IEnvironment) {

    const debugSingleton = AppDebugEnvironment.getInstance()

    // 1 - Create the module instance
    const configuration = new Factory.Configuration()
    const moduleId = Factory.id + "_" + uuidv4()
    const mdle = new Factory.Module({ moduleId, configuration, Factory, ready$, environment })
    const moduleView = new ModuleView(mdle.moduleId, coors[0], coors[1], Factory)

    // 2 - Create a new group/component instance with new module added

    const groupMdle = project.workflow.modules.find((mdle) => mdle.moduleId == activeLayerId)
    const persistentData = new groupMdle.Factory.PersistentData({
        ...groupMdle.getPersistentData(),
        moduleIds: groupMdle.getPersistentData<GroupModules.PersistentData>().getModuleIds().concat(moduleId)
    })
    const grpConfiguration = new ModuleConfiguration({ ...groupMdle.configuration, data: persistentData })
    const groupModuleNew = new groupMdle.Factory.Module(Object.assign({}, groupMdle, { configuration: grpConfiguration }))

    // let rootLayerTreeNew = cloneLayerTree(project.workflow.rootLayerTree)
    // let parentLayer = getLayer(undefined,rootLayerTreeNew,activeLayerId)[0]
    // parentLayer.moduleIds.push(moduleId)

    const workflow = new Workflow({
        ...project.workflow,
        ...{
            modules: project.workflow.modules
                .filter(mdle => mdle.moduleId != groupMdle.moduleId)
                .concat(mdle, groupModuleNew),
            rootLayerTree: undefined
        }
    })

    const builderRendering = new BuilderRendering(
        project.builderRendering.modulesView.concat(moduleView),
        project.builderRendering.connectionsView,
        project.builderRendering.descriptionsBoxes
    )
    const projectNew = new Project({
        ...project,
        ...{
            workflow,
            builderRendering
        }
    })

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: "add module",
            object: {
                factory: Factory,
                module: mdle,
                moduleView: moduleView,
                project: projectNew
            }
        })

    return projectNew
}

function duplicate({ mdle, ready$, configuration, parent, workflow }: { mdle, ready$, configuration?, parent?, workflow?}) {

    // should new mdle.Factory.Module(mdle) not be sufficient or almost (should we allow config to change) ??
    const Factory = mdle.Factory
    if (configuration == undefined) {
        const persistentData = new Factory.PersistentData(mdle.configuration.data)
        configuration = new Factory.Configuration({ title: mdle.configuration.title, description: mdle.configuration.description, data: persistentData })
    }
    const isPlugin = "parentModule" in mdle
    return isPlugin ?
        new mdle.Factory.Module({
            parentModule: parent ? parent : (mdle as PluginFlux<any>).parentModule,
            moduleId: mdle.moduleId, configuration,
            ready$,
            Factory,
            cache: mdle.cache,
            environment: mdle.environment
        }) :
        new mdle.Factory.Module(Object.assign({}, mdle, { workflow: workflow, configuration, ready$, Factory }))
}

export function updateModule(
    mdle: ModuleFlux,
    configuration: ModuleConfiguration,
    project: Project,
    allConnectionsSubscription: Map<Connection, Subscription>,
    ready$): Project {

    const debugSingleton = AppDebugEnvironment.getInstance()

    const Factory = mdle.Factory
    const isPlugin = "parentModule" in mdle

    const newModule = duplicate({ mdle, ready$, configuration, workflow: project.workflow })

    if (newModule instanceof GroupModules.Module) {
        //throw "UPDATE MODULE: WHAT TO DO IN CASE OF GROUP? Try remove the throw...it may works"

        // let layerTree = project.workflow.rootLayerTree
        // layerTree = cloneLayerTree(project.workflow.rootLayerTree)
        // getLayer(undefined, layerTree, newModule.layerId)[0].title = newModule.configuration.title
    }

    const getChildrenRec = (mdle: ModuleFlux): Array<any> => {
        const directChildren = project.workflow.plugins.filter(plugin => plugin.parentModule.moduleId == mdle.moduleId)
        const indirectChildren = directChildren.map(child => getChildrenRec(child)).filter(d => d.length > 0)
        if (indirectChildren.length > 0)
            {throw "UPDATE MODULE: IMPLEMENTATION NOT DONE IN CASE OF NESTED PLUGINS"}
        return directChildren.concat(indirectChildren.reduce((acc, e) => acc.concat(e), []))
    }
    const children = getChildrenRec(mdle)

    const toRemoveIds = [mdle.moduleId].concat(children.map(m => m.moduleId))
    const otherModules = project.workflow.modules.filter(m => !toRemoveIds.includes(m.moduleId))
    const otherPlugins = project.workflow.plugins.filter(m => !toRemoveIds.includes(m.moduleId))

    const newModules = isPlugin ? project.workflow.modules : otherModules.concat([newModule])
    let newPlugins = isPlugin ? otherPlugins.concat([newModule]) : otherPlugins
    newPlugins = newPlugins.concat(children.map(child => duplicate({ mdle: child, ready$, parent: newModule })))

    /*
    The module from which updates come can have some inputs/outputs that does not exist anymore.
    This piece of code select them and remove them from the current connections
    */
    const remainingInputSlots = newModule.inputSlots.map(s => s.slotId)
    const remainingOutputSlots = newModule.outputSlots.map(s => s.slotId)
    const connections = project.workflow.connections.filter((connection) => {
        if (connection.start.moduleId == newModule.moduleId && !remainingOutputSlots.includes(connection.start.slotId))
            {return false}
        if (connection.end.moduleId == newModule.moduleId && !remainingInputSlots.includes(connection.end.slotId))
            {return false}
        return true
    })

    const workflow = new Workflow({
        modules: newModules,
        connections,
        plugins: newPlugins
    })

    const projectNew = new Project({
        ...project,
        ...{ workflow }
    })

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: "module updated",
            object: {
                factory: Factory,
                newModule: newModule,
                newConfiguration: configuration,
                plugins: children,
                project: projectNew,
                newPlugins, toRemoveIds, newModules, otherModules, otherPlugins
            }
        })
    return projectNew
}

export function alignH(moduleIds: Array<string>, project: Project, ready$) {

    const modulesView = project.builderRendering.modulesView.filter(m => moduleIds.includes(m.moduleId))
    const modulesViewToKeep = project.builderRendering.modulesView.filter(m => !moduleIds.includes(m.moduleId))
    const yAverage = modulesView.reduce((acc, m) => acc + m.yWorld, 0) / modulesView.length
    const newViews = modulesView.map(m => new ModuleView(m.moduleId, m.xWorld, yAverage, m.Factory))
    const projectNew = new Project({
        ...project,
        ...{
            builderRendering: new BuilderRendering(modulesViewToKeep.concat(newViews),
                project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes)
        }
    })

    return projectNew
}
export function alignV(moduleIds: Array<string>, project: Project, ready$) {

    const modulesView = project.builderRendering.modulesView.filter(m => moduleIds.includes(m.moduleId))
    const modulesViewToKeep = project.builderRendering.modulesView.filter(m => !moduleIds.includes(m.moduleId))
    const xAverage = modulesView.reduce((acc, m) => acc + m.xWorld, 0) / modulesView.length
    const newViews = modulesView.map(m => new ModuleView(m.moduleId, xAverage, m.yWorld, m.Factory))
    const projectNew = new Project({
        ...project,
        ...{
            builderRendering: new BuilderRendering(modulesViewToKeep.concat(newViews),
                project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes)
        }
    })

    return projectNew
}


export function duplicateModules(
    modules: Array<ModuleFlux>,
    project: Project,
    ready$): Project {

    const debugSingleton = AppDebugEnvironment.getInstance()
    const wf = project.workflow
    const newModules = modules.map((m: ModuleFlux) => {

        const configuration = new m.Factory.Configuration({
            title: m.configuration.title,
            description: m.configuration.description,
            data: _.cloneDeep(m.configuration.data)
        })
        const moduleId = m.Factory.id + "_" + uuidv4()
        const mdle = new m.Factory.Module({
            moduleId, configuration, ready$, Factory: m.Factory, environment: m.environment
        })
        return mdle
    })

    const views = project.builderRendering.modulesView.filter(mView => modules.map(m => m.moduleId).includes(mView.moduleId))
    const maxYWorld = Math.max(...views.map(mView => mView.yWorld))
    const maxXWorld = Math.max(...views.map(mView => mView.xWorld))
    const newViews = modules.map((m: ModuleFlux, i) => {
        const newView = new ModuleView(newModules[i].moduleId, maxXWorld + (i + 1) * 50, maxYWorld + (i + 1) * 50, m.Factory)
        return newView
    })
    const parentGroups = modules
        .map((mdle, index) => {
            const parent = project.workflow.modules
                .find(grp =>
                    grp instanceof GroupModules.Module &&
                    grp.getModuleIds().includes(mdle.moduleId)
                )
            return [parent.moduleId, newModules[index].moduleId]
        })
        .reduce((acc, [parentId, mdleId]) => {
            acc[parentId] = acc[parentId]
                ? acc[parentId].concat(mdleId)
                : [mdleId]
            return acc
        }, {})

    const newGroups = Object.entries(parentGroups).map(([parentId, moduleIds]: [string, string[]]) => {
        const parent = project.workflow.modules.find(mdle => mdle.moduleId == parentId) as GroupModules.Module
        const persistentData = parent.getPersistentData<GroupModules.Module>()
        const newGroup = updateGroup(parent, { moduleIds: persistentData.getModuleIds().concat(...moduleIds) })
        return newGroup
    })

    const builderRenderer = new BuilderRendering(project.builderRendering.modulesView.concat(newViews),
        project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes)

    const projectNew = new Project({
        ...project,
        ...{
            workflow: new Workflow({
                modules: wf.modules
                    .filter(mdl => !newGroups.map(mdle => mdle.moduleId).includes(mdl.moduleId))
                    .concat(...newModules, ...newGroups),
                connections: wf.connections,
                plugins: wf.plugins
            }),
            builderRendering: builderRenderer
        }
    })

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: "duplicateModules",
            object: { modules, newModules, newViews, projectNew }
        })
    return projectNew
}

export function moveModules(modulesPosition, moduleViews, project: Project, implicitModules): Project {

    const debugSingleton = AppDebugEnvironment.getInstance()

    const explicitModulesPosition = modulesPosition.map(
        modulePosition => [modulePosition]
    ).reduce((acc, e) => acc.concat(e), [])

    const modulesViewToKeep = moduleViews.filter(m =>
        !explicitModulesPosition.map(mNew => mNew.moduleId).includes(m.moduleId))

    const modulesViewNew = explicitModulesPosition
        .map(mdle => [mdle, moduleViews.find(m => m.moduleId == mdle.moduleId)])
        .filter(([mdle, mOld]) => Math.abs(mOld.xWorld - mdle.x) > 3 || Math.abs(mOld.yWorld - mdle.y) > 3)
        .map(([mdle, mOld]) => new ModuleView(mdle.moduleId, mdle.x, mdle.y, mOld.Factory))

    if (modulesViewNew.length == 0)
        {return undefined}

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: "move modules",
            object: { modulesPosition, modulesViewToKeep, modulesViewNew }
        })

    const boxNeedUpdate = project.builderRendering.descriptionsBoxes.find(box =>
        box.modulesId.length !== box.modulesId.filter(mId => modulesViewNew.map(m => m.moduleId).indexOf(mId) >= 0).length)

    const descriptionBoxes = boxNeedUpdate ? project.builderRendering.descriptionsBoxes.map(
        box => {
            if (!box.modulesId.find(mId => modulesViewNew.map(m => m.moduleId).indexOf(mId) >= 0))
                {return box}
            return new DescriptionBox(box.descriptionBoxId, box.title, box.modulesId, box.descriptionHtml, box.properties)
        }) :
        project.builderRendering.descriptionsBoxes


    const projectNew = new Project({
        ...project,
        ...{
            builderRendering: new BuilderRendering(modulesViewToKeep.concat(modulesViewNew),
                project.builderRendering.connectionsView,
                descriptionBoxes)
        }
    })

    return projectNew
}


export function clonePluginsForNewParents(parentModules: ModuleFlux[], workflow: Workflow){

    return parentModules
    .map( (mdle: ModuleFlux) => {
        return [mdle, workflow.plugins.find( p => p.parentModule.moduleId == mdle.moduleId)] 
    })
    .filter( ([mdle, plugin]) => plugin != undefined)
    .map( ([mdle, plugin]) => {
        return new plugin.Factory.Module({...plugin, parentModule:mdle})
    })
}


export function deleteModules(modulesDeleted: Array<ModuleFlux>, project: Project): Project {

    const debugSingleton = AppDebugEnvironment.getInstance()

    if (modulesDeleted.length === 0)
        {return undefined}
    const modulesDeletedId = modulesDeleted.map(m => m.moduleId)
    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: "deleteModules",
            object: {
                modulesDeleted: modulesDeleted
            }
        })
    const grpMdlesDeleted = modulesDeleted.filter(mdle => mdle instanceof GroupModules.Module)
    const inGroupModulesDeleted = grpMdlesDeleted
        .map((grpMdle: GroupModules.Module) => grpMdle.getAllChildren(project.workflow))
        .flat()

    // get parent groups that contains at least one of the deleted modules
    const parentGroups = project.workflow.modules
        .filter(mdle => mdle instanceof GroupModules.Module)
        .filter((mdle: GroupModules.Module) => !grpMdlesDeleted.includes(mdle))
        .filter((mdle: GroupModules.Module) => {
            const childIds = mdle.getModuleIds()
            const filtered = childIds.filter(mId => !modulesDeletedId.includes(mId))
            return childIds.length != filtered.length
        })

    const modulesNotReplacedId = [
        ...modulesDeleted.map(m => m.moduleId),
        ...inGroupModulesDeleted.reduce((acc, e) => acc.concat(e.moduleId), [])
    ]
    const pluginsNotReplacedId = project.workflow.plugins
        .filter(plugin => modulesNotReplacedId.includes(plugin.parentModule.moduleId))
        .map(p => p.moduleId)

    // those are the ids that will be removed (not replaced) 
    const idsRemoved = [...modulesNotReplacedId, ...pluginsNotReplacedId]

    const newGroupsReplaced =  parentGroups.map((mdle: GroupModules.Module) => {
        const childIds = mdle.getModuleIds()
        const filtered = childIds.filter(mId => !idsRemoved.includes(mId))
        return updateGroup(mdle, { moduleIds: filtered })
    })
    
    const newPluginsReplaced = clonePluginsForNewParents(newGroupsReplaced, project.workflow)

    const modulesToDeleteId = [
        ...modulesNotReplacedId,
        ...pluginsNotReplacedId,
        ...parentGroups.map( mdle => mdle.moduleId),
        ...newPluginsReplaced.map( mdle => mdle.moduleId)
    ]

    const modules = project.workflow.modules
        .filter(m => !modulesToDeleteId.includes(m.moduleId))
        .concat(...newGroupsReplaced)

    const plugins = project.workflow.plugins
        .filter(m => !modulesToDeleteId.includes(m.moduleId))
        .concat(newPluginsReplaced)

    const modulesView = project.builderRendering.modulesView
        .filter(m => !idsRemoved.includes(m.moduleId))

    const connectionsToKeep = project.workflow.connections
        .filter(c => !idsRemoved.includes(c.end.moduleId) &&
            !idsRemoved.includes(c.start.moduleId))

    const workflow = new Workflow({
        modules,
        connections: connectionsToKeep,
        plugins
    })

    const boxNeedUpdate = project.builderRendering.descriptionsBoxes.find(box =>
        box.modulesId.length !== box.modulesId.filter(mId => modulesDeleted.map(m => m.moduleId).indexOf(mId) >= 0).length)

    const descriptionBoxes = boxNeedUpdate ? project.builderRendering.descriptionsBoxes.map(
        box => {
            const moduleIdsToKeep = box.modulesId.filter(mId => modulesDeleted.map(m => m.moduleId).indexOf(mId) < 0)
            if (moduleIdsToKeep.length == box.modulesId.length)
                {return box}
            console.log("REMOVE MODULE FORM DBOX", moduleIdsToKeep)
            return new DescriptionBox(box.descriptionBoxId, box.title, moduleIdsToKeep, box.descriptionHtml, box.properties)
        }) :
        project.builderRendering.descriptionsBoxes

    const projectNew = new Project({
        ...project,
        ...{
            workflow,
            builderRendering: new BuilderRendering(modulesView, project.builderRendering.connectionsView, descriptionBoxes)
        }
    })
    return projectNew
}