import { BuilderRendering, Component, GroupModules, IEnvironment, ModuleConfiguration, ModuleFlux, ModuleView, Project, uuidv4, Workflow} from '@youwol/flux-core'
import { Observable } from 'rxjs'
import { AppDebugEnvironment, LogLevel } from '.'



export function getGroup(workflow: Workflow, parentGroup: GroupModules.Module, group: GroupModules.Module, id: string) : 
[GroupModules.Module, GroupModules.Module] {

    if( group.moduleId === id )
        {return [group,parentGroup]}
    
    let found = undefined
    let groups = group.getDirectChildren(workflow)
    .filter(mdle => mdle instanceof GroupModules.Module)

    for(let mdle of groups){
        let element =  getGroup(workflow, group, mdle as GroupModules.Module, id)
        if(element){
            found = element
            break
        }
    }
    
    return found
}


export function createGroup(
    title: string,
    modules: Array<ModuleFlux>,
    project:Project, 
    currentLayerId : string,
    Factory,
    configuration,
    workflow$: Observable<Workflow>,
    environment: IEnvironment
    ):{project:Project}{
    
    let debugSingleton = AppDebugEnvironment.getInstance()
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
       level : LogLevel.Info, 
         message: "createLayer", 
          object:{
            modules:modules,
            title:title
        }
    })
    
    let modulesId = modules.map( mdle=>mdle.moduleId)
    
    let newGrpMdle = new Factory.Module({
        moduleId: Factory.id.replace("@","_")+"_" + uuidv4(), 
        configuration:new ModuleConfiguration({
            title,
            description:'',
            data: new Factory.PersistentData({moduleIds:modules.map(m=>m.moduleId)})
        }),
        Factory: Factory,
        workflow$,
        environment
    })
    let parentGroup = project.workflow.modules.find( mdle => mdle.moduleId == currentLayerId) as GroupModules.Module
    let parentGroupUpdated = updateGroup(parentGroup, {
        moduleIds:parentGroup.getModuleIds().filter( mId => !modulesId.includes(mId)).concat(newGrpMdle.moduleId)})
    
    let workflow = new Workflow({
        modules: project.workflow.modules
        .filter(mdle => mdle.moduleId != parentGroup.moduleId)
        .concat(newGrpMdle, parentGroupUpdated),
        connections:project.workflow.connections,
        plugins:project.workflow.plugins
    })

    let moduleViewsInGrp  = project.builderRendering.modulesView
    .filter( view => newGrpMdle.getModuleIds().includes(view.moduleId))
    
    let xWorld       = moduleViewsInGrp.reduce((acc,e)=> acc+e.xWorld ,0) / moduleViewsInGrp.length
    let yWorld       = moduleViewsInGrp.reduce((acc,e)=> acc+e.yWorld ,0) / moduleViewsInGrp.length    
    let moduleView   = new ModuleView(newGrpMdle.moduleId,xWorld,yWorld,Factory)
    let moduleViews  = [...project.builderRendering.modulesView,moduleView]
    
    let projectNew = new Project({
        ...project,
        ...{
            workflow,
            builderRendering: new BuilderRendering(moduleViews, project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes),
        }
    })

    return { project:projectNew}
}


export function updateGroup( original: GroupModules.Module, persistentFields : any ) : GroupModules.Module {

    let persistentData   = new original.Factory.PersistentData({
        ...original.getPersistentData(),
        ...persistentFields
    })
    let grpConfiguration = new ModuleConfiguration({...original.configuration, data: persistentData})
    let groupModuleNew = new original.Factory.Module( Object.assign({}, original, { configuration:grpConfiguration })) 
    return groupModuleNew
}

export function updateComponent( original: Component.Module, persistentFields : any ) : Component.Module {

    return updateGroup(original, persistentFields) as  Component.Module
}

export function getDisplayedModulesView(
    group: GroupModules.Module,
    parentGroup: GroupModules.Module | undefined,
    appStore,
    project:Project) {

    let modulesId = group.getModuleIds()
    let unitModulesView = project.builderRendering.modulesView.filter(moduleView => modulesId.includes(moduleView.moduleId))
    let parentUnitModulesView = []
    if (parentGroup) {
        
        let modulesId = parentGroup.getModuleIds()
        parentUnitModulesView = project.builderRendering.modulesView.filter(moduleView => modulesId.includes(moduleView.moduleId))       
    }
    return {
        parentLayer: {
            modulesView: parentUnitModulesView.filter( mView =>!mView.moduleId.includes(group.moduleId)),
            modules: parentUnitModulesView.map(view => appStore.getModule(view.moduleId)),
            currentGroupModuleView: parentUnitModulesView.find( mView =>mView.moduleId.includes(group.moduleId))
        },
        currentLayer: {
            modulesView: unitModulesView,
            modules: unitModulesView.map(view => appStore.getModule(view.moduleId))
        }
    }
}
