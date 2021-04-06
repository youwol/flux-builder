import { LogLevel, AppDebugEnvironment } from './app-debug.environment'
import { uuidv4 } from './utils'
import { ModuleView, Workflow, BuilderRendering, Project, ModuleFlow, GroupModules,
    ModuleConfiguration, PluginFlow, Connection, RunnerRendering, DescriptionBox, LayerTree } 
    from '@youwol/flux-core'
import { Subscription } from 'rxjs'
import { cloneLayerTree, getLayer, cleanChildrenLayers } from './app-store-layer'

import { AppObservables } from './app-observables.service'

declare var _ : any

export function defaultModuleRendering(mdle) {

    let div = <HTMLDivElement>(document.createElement('div'))
    div.setAttribute("id", mdle.moduleId )
    div.setAttribute("name", mdle.configuration.title )
    div.classList.add("flux-component")
    if(mdle.moduleId.includes("viewer3d"))
      div.classList.add("fill-parent")
    
      if(mdle.moduleId.includes("cesium"))
      div.classList.add("fill-parent")
    return div
  }
export function isGroupingModule(moduleData){
    return ["GroupModules@flux-pack-core", "Component@flux-pack-core"].includes(moduleData.factoryId)
}
/*
export function instantiateModules( modulesData, modulesFactory, appObservables : AppObservables,
     environment, workflowGetter ): Array<ModuleFlow>{

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
export function addModule( Factory,coors, project: Project , activeLayerId, ready$ : any, environment: any) {

    let debugSingleton = AppDebugEnvironment.getInstance()

    let configuration   = new Factory.Configuration()
    let moduleId        = Factory.id + "_" + uuidv4()
    let mdle            = new Factory.Module( {moduleId, configuration, Factory, ready$, environment }) 
    let moduleView      = new ModuleView( mdle.moduleId, coors[0], coors[1],Factory )

    let rootLayerTreeNew = cloneLayerTree(project.workflow.rootLayerTree)
    let parentLayer = getLayer(undefined,rootLayerTreeNew,activeLayerId)[0]
    parentLayer.moduleIds.push(moduleId)

    let workflow   = new Workflow(  project.workflow.modules.concat(mdle),
                                    project.workflow.connections,
                                    project.workflow.plugins,
                                    rootLayerTreeNew)
                                    
    
    let builderRendering = new BuilderRendering(
        project.builderRendering.modulesView.concat(moduleView),
        project.builderRendering.connectionsView,
        project.builderRendering.descriptionsBoxes
        )
    let layout = project.runnerRendering.layout 
    if(Factory.RenderView != undefined){
        let div = defaultModuleRendering(mdle)
        layout = project.runnerRendering.layout + div.outerHTML+ "\n" 
    }
                
    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        builderRendering,
        new RunnerRendering(layout, project.runnerRendering.style)
    )
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "add module", 
        object:{    factory: Factory,
                    module : mdle,
                    moduleView : moduleView,
                    project : projectNew 
                    }
    })

    return projectNew    
}

function duplicate( { mdle ,  ready$, configuration, parent, workflow } :{ mdle,  ready$, configuration?, parent?, workflow? }  ) {

    let Factory = mdle.Factory
    if(configuration == undefined){
        let persistentData = new Factory.PersistentData(mdle.configuration.data)
        configuration = new Factory.Configuration( { title: mdle.configuration.title, description: mdle.configuration.description, data: persistentData} )
    }
    let isPlugin = "parentModule" in mdle 
    return isPlugin ? 
        new mdle.Factory.Module( { 
            parentModule : parent ? parent : (mdle as PluginFlow<any>).parentModule,
            moduleId: mdle.moduleId,configuration, 
            ready$, 
            Factory,
            cache:mdle.cache,
            environment: mdle.environment}):
        new mdle.Factory.Module( Object.assign({}, mdle, {workflow: workflow, configuration, ready$, Factory}))
}

export function updateModule(mdle:ModuleFlow, 
    configuration: ModuleConfiguration, 
    project: Project ,
    allConnectionsSubscription:Map<Connection, Subscription>,
    ready$) : Project  {        

    let debugSingleton = AppDebugEnvironment.getInstance()

    let Factory   = mdle.Factory
    let isPlugin = "parentModule" in mdle 
    
    let newModule = duplicate( {mdle ,  ready$, configuration, workflow:project.workflow} ) 
    
    let layerTree = project.workflow.rootLayerTree
    if( newModule instanceof GroupModules.Module ){
        layerTree = cloneLayerTree(project.workflow.rootLayerTree)
        getLayer(undefined, layerTree, newModule.layerId)[0].title = newModule.configuration.title
    }

    let getChildrenRec = ( mdle:ModuleFlow) : Array<any> => {
            let directChildren =  project.workflow.plugins.filter( plugin => plugin.parentModule.moduleId == mdle.moduleId )
            let indirectChildren = directChildren.map( child => getChildrenRec(child)).filter( d => d.length>0 )
            if(indirectChildren.length >0)
                throw "UPDATE MODULE: IMPLEMENTATION NOT DONE IN CASE OF NESTED PLUGINS"
            return directChildren.concat(indirectChildren.reduce( (acc,e)=> acc.concat(e), []))
    }
    let children        =  getChildrenRec( mdle )
     
    let toRemoveIds     = [mdle.moduleId].concat( children.map( m=>m.moduleId))
    let otherModules    =  project.workflow.modules.filter( m=> ! toRemoveIds.includes(m.moduleId) )
    let otherPlugins    =  project.workflow.plugins.filter( m=> ! toRemoveIds.includes(m.moduleId) )

    let newModules =  isPlugin ?  project.workflow.modules :  otherModules.concat([newModule])
    let newPlugins =  isPlugin ?  otherPlugins.concat([newModule]) : otherPlugins
    newPlugins =   newPlugins.concat( children.map( child => duplicate( {mdle:child ,  ready$, parent: newModule} ) ))

    /*
    The module from which updates come can have some inputs/outputs that does not exist anymore.
    This piece of code select them and remove them from the current connections
    */
    let remainingInputSlots = newModule.inputSlots.map( s => s.slotId)
    let remainingOutputSlots = newModule.outputSlots.map( s => s.slotId)
    let connections = project.workflow.connections.filter( (connection) => {
        if (connection.start.moduleId == newModule.moduleId && !remainingOutputSlots.includes(connection.start.slotId) )
            return false        
        if (connection.end.moduleId == newModule.moduleId && !remainingInputSlots.includes(connection.end.slotId) )
            return false
        return true
    })

    let workflow   = new Workflow(  newModules, connections, newPlugins , layerTree )   

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        project.builderRendering,
        project.runnerRendering
    )   
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "module updated", 
        object:{    factory: Factory,
                    newModule : newModule,
                    newConfiguration:configuration,
                    plugins: children,
                    project: projectNew,
                    newPlugins, toRemoveIds, newModules, otherModules, otherPlugins
                    }
    })
    return projectNew
}

export function alignH(moduleIds:Array<string>, project: Project ,ready$){

    let modulesView = project.builderRendering.modulesView.filter( m => moduleIds.includes(m.moduleId))
    let modulesViewToKeep = project.builderRendering.modulesView.filter( m => !moduleIds.includes(m.moduleId))
    let yAverage    = modulesView.reduce(  (acc,m) => acc + m.yWorld, 0) / modulesView.length
    let newViews    = modulesView.map( m => new ModuleView(m.moduleId,m.xWorld,yAverage,m.Factory))
    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        project.workflow,
        new BuilderRendering(modulesViewToKeep.concat(newViews), 
            project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes),
        project.runnerRendering
    )  
    return projectNew
}
export function alignV(moduleIds:Array<string>, project: Project ,ready$){

    let modulesView = project.builderRendering.modulesView.filter( m => moduleIds.includes(m.moduleId))
    let modulesViewToKeep = project.builderRendering.modulesView.filter( m => !moduleIds.includes(m.moduleId))
    let xAverage    = modulesView.reduce(  (acc,m) => acc + m.xWorld, 0) / modulesView.length
    let newViews    = modulesView.map( m => new ModuleView(m.moduleId,xAverage,m.yWorld,m.Factory))
    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        project.workflow,
        new BuilderRendering(modulesViewToKeep.concat(newViews), 
            project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes),
        project.runnerRendering
    )  
    return projectNew
}
export function duplicateModules(modules:Array<ModuleFlow>, 
    project: Project ,
    ready$) : Project  {        

    let debugSingleton  = AppDebugEnvironment.getInstance()
    let wf              = project.workflow
    let tree            = project.workflow.rootLayerTree
    let newModules      = modules.map( (m:ModuleFlow) => { 

        let configuration = new m.Factory.Configuration({
            title: m.configuration.title,
            description: m.configuration.description,
            data: _.cloneDeep(m.configuration.data) 
        })        
        let moduleId  = m.Factory.id + "_" + uuidv4()
        let mdle      = new m.Factory.Module({
            moduleId,configuration,ready$,Factory:m.Factory,environment: m.environment})
        return mdle
    })
    
    let views =  project.builderRendering.modulesView.filter( mView => modules.map(m=>m.moduleId).includes(mView.moduleId))
    let maxYWorld = Math.max(...views.map( mView => mView.yWorld ))
    let maxXWorld = Math.max(...views.map( mView => mView.xWorld ))
    let newViews   = modules.map( (m:ModuleFlow,i) => {
        let newView = new ModuleView(newModules[i].moduleId,maxXWorld+ (i+1)*50,maxYWorld + (i+1)*50,  m.Factory)
        return newView
    })
    let newLayerTree = cloneLayerTree(tree) 
    modules.map( (mdle,i) => {
        let layer = newLayerTree.getLayerRecursive((layer:LayerTree)=>layer.moduleIds.includes(mdle.moduleId))
        layer.moduleIds.push(newModules[i].moduleId)
    })
    let builderRenderer = new BuilderRendering(project.builderRendering.modulesView.concat(newViews), 
        project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes)
    wf.rootLayerTree.moduleIds.concat(newModules.map(m => m.moduleId))

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        new Workflow(  wf.modules.concat(newModules),wf.connections,wf.plugins, newLayerTree),
        builderRenderer,
        project.runnerRendering
    )   
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "duplicateModules", 
        object:{ modules,newModules,newViews, projectNew ,newLayerTree}
    })
    return projectNew
}

export function moveModules( modulesPosition, moduleViews, project:Project , implicitModules) : Project{

    let debugSingleton = AppDebugEnvironment.getInstance()

    let explicitModulesPosition = modulesPosition.map(
        modulePosition =>[modulePosition]
    ).reduce((acc,e)=> acc.concat(e), [])
    
    let modulesViewToKeep = moduleViews.filter( m => 
        !explicitModulesPosition.map(mNew=> mNew.moduleId).includes(m.moduleId) )

    let modulesViewNew = explicitModulesPosition
    .map( mdle => [mdle,moduleViews.find( m => m.moduleId==mdle.moduleId)])
    .filter( ([mdle,mOld]) => Math.abs(mOld.xWorld - mdle.x) > 3 ||  Math.abs(mOld.yWorld -mdle.y) > 3 )
    .map( ([mdle,mOld]) => new ModuleView( mdle.moduleId, mdle.x,mdle.y,mOld.Factory ) )
    
    if( modulesViewNew.length == 0 )
        return undefined

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "move modules", 
        object:{ modulesPosition, modulesViewToKeep,modulesViewNew}
    })

    let boxNeedUpdate = project.builderRendering.descriptionsBoxes.find( box => 
        box.modulesId.length !== box.modulesId.filter( mId => modulesViewNew.map( m =>m.moduleId).indexOf(mId) >= 0 ).length )
    
    let descriptionBoxes = boxNeedUpdate ?  project.builderRendering.descriptionsBoxes.map(
        box => {
            if( !box.modulesId.find( mId => modulesViewNew.map( m =>m.moduleId).indexOf(mId) >= 0 ) )
                return box
            return new DescriptionBox(box.descriptionBoxId,box.title,box.modulesId,box.descriptionHtml,box.properties)
        }):
        project.builderRendering.descriptionsBoxes


    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        project.workflow,
        new BuilderRendering(modulesViewToKeep.concat(modulesViewNew),
                             project.builderRendering.connectionsView,
                             descriptionBoxes),
        project.runnerRendering
    )
    return projectNew        
}

function getIncludedModule(grpMdle:GroupModules.Module, workflow:Workflow){

    let layer = workflow.rootLayerTree.getLayerRecursive((layer)=> layer.layerId == grpMdle.layerId)
    let getModulesRec = ( layer:LayerTree ) => layer.moduleIds.concat( 
        layer.children.reduce( (acc,layer) => acc.concat(getModulesRec(layer)), []))
    return getModulesRec(layer)
}

export function deleteModules(modulesDeleted:Array<ModuleFlow>, project:Project ): Project{

    let debugSingleton = AppDebugEnvironment.getInstance()

    if(modulesDeleted.length === 0)
        return undefined
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
         message: "deleteModules", 
          object:{modulesDeleted: modulesDeleted
        }
    })
   let grpMdles = modulesDeleted.filter( mdle => mdle instanceof GroupModules.Module )
   let includedModules = grpMdles.map( grpMdle => getIncludedModule(grpMdle as GroupModules.Module, project.workflow) )
   let modulesToDeleteId  = [...modulesDeleted.map( m => m.moduleId),...includedModules.reduce( (acc,e)=>acc.concat(e),[])]

   let indirectDeletedId = project.workflow.plugins
   .filter( plugin=> modulesToDeleteId.includes(plugin.parentModule.moduleId)  )
   .map( p => p.moduleId)

   modulesToDeleteId = modulesToDeleteId.concat( indirectDeletedId )

   let newLayerTree = cloneLayerTree(project.workflow.rootLayerTree, (mId) => !modulesToDeleteId.includes(mId))
   newLayerTree     = cleanChildrenLayers(newLayerTree)
   
   let modules      = project.workflow.modules
   .filter(m => !modulesToDeleteId.includes(m.moduleId) )

   let pluginsToKeep = project.workflow.plugins
   .filter(m => !modulesToDeleteId.includes(m.moduleId) )
   console.log("modules",modules)


   let modulesView = project.builderRendering.modulesView
   .filter(m => !modulesToDeleteId.includes(m.moduleId)  )

    let connectionsToKeep = project.workflow.connections
    .filter( c => !modulesToDeleteId.includes(c.end.moduleId) && 
    !modulesToDeleteId.includes(c.start.moduleId))

    let workflow   = new Workflow(modules,connectionsToKeep,pluginsToKeep,newLayerTree)

    let boxNeedUpdate = project.builderRendering.descriptionsBoxes.find( box => 
        box.modulesId.length !== box.modulesId.filter( mId => modulesDeleted.map( m =>m.moduleId).indexOf(mId) >= 0 ).length )
    
    let descriptionBoxes = boxNeedUpdate ?  project.builderRendering.descriptionsBoxes.map(
        box => {
            let moduleIdsToKeep = box.modulesId.filter( mId => modulesDeleted.map( m =>m.moduleId).indexOf(mId) < 0 )
            if( moduleIdsToKeep.length == box.modulesId.length )
                return box
            console.log("REMOVE MODULE FORM DBOX", moduleIdsToKeep)
            return new DescriptionBox(box.descriptionBoxId,box.title,moduleIdsToKeep,box.descriptionHtml,box.properties)
        }):
        project.builderRendering.descriptionsBoxes

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        new BuilderRendering(modulesView, project.builderRendering.connectionsView,descriptionBoxes),
        project.runnerRendering
    )
    return projectNew
}