import { Project, LayerTree, Workflow, BuilderRendering, ModuleView,
    ModuleFlow, GroupModules} from '@youwol/flux-core';
    
import { uuidv4 } from './utils';
import { AppDebugEnvironment, LogLevel } from './app-debug.environment';


export function getLayer(parentLayer: LayerTree, layerTree: LayerTree, id: string) {

    if( layerTree.layerId === id )
        return [layerTree,parentLayer]
    
    let r = undefined
    layerTree.children.forEach( c =>{
        if(!r)
            r = getLayer(layerTree,c,id)
        
    })
    return r
}

export function cloneLayerTree(layerTree: LayerTree, filter = (mdleId:string)=>true ) :LayerTree {

    return  new LayerTree(layerTree.layerId,layerTree.title,layerTree.children.map(c => cloneLayerTree(c,filter)),
        layerTree.moduleIds.filter( mId=>filter(mId)))
}
export function cleanChildrenLayers(layerTree: LayerTree, moduleIds = undefined) : LayerTree{
    
    let children = layerTree.children.filter( c => c.moduleIds.length > 0)
    return new LayerTree(layerTree.layerId,layerTree.title,
        children.map( c => cleanChildrenLayers(c,moduleIds)), moduleIds ? layerTree.moduleIds.filter( m => moduleIds.includes(m) ) :layerTree.moduleIds )
}
export function createLayer(
    title: string,
    modules: Array<ModuleFlow>,
    project:Project, 
    currentLayerId : string,
    Factory,
    configuration,
    workflowGetter):{project:Project, layer:LayerTree}{
    
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
    let layer = new LayerTree( uuidv4(),title,[],modulesId)
    let childrenLayerInclude = modules.filter( mdle =>mdle instanceof GroupModules.Module).map( (mdle:GroupModules.Module) =>mdle.layerId)

    let rootLayerTreeNew  = cloneLayerTree(project.workflow.rootLayerTree)
    let parentLayer       = getLayer(undefined,rootLayerTreeNew,currentLayerId)[0]
    parentLayer.moduleIds = parentLayer.moduleIds.filter( id => !modulesId.includes(id))
    parentLayer.children.filter( chidlLayer => childrenLayerInclude.includes(chidlLayer.layerId)).forEach( chidlLayer => layer.children.push(chidlLayer))
    parentLayer.children = parentLayer.children.filter( chidlLayer => !childrenLayerInclude.includes(chidlLayer.layerId))
    parentLayer.children.push(layer)
        
    let grpMdle = new Factory.Module( {
        moduleId: Factory.id.replace("@","_")+"_"+layer.layerId, 
        configuration:configuration,
        Factory: Factory,
        workflowGetter: workflowGetter,
        layerId: layer.layerId})
        
    let workflow = new Workflow([...project.workflow.modules, grpMdle ],project.workflow.connections,project.workflow.plugins, rootLayerTreeNew)

    let moduleViewsInGrp  = project.builderRendering.modulesView.filter( view => layer.moduleIds.includes(view.moduleId))
    
    let xWorld       = moduleViewsInGrp.reduce((acc,e)=> acc+e.xWorld ,0) / moduleViewsInGrp.length
    let yWorld       = moduleViewsInGrp.reduce((acc,e)=> acc+e.yWorld ,0) / moduleViewsInGrp.length    
    let moduleView   = new ModuleView(grpMdle.moduleId,xWorld,yWorld,Factory)
    let moduleViews  = [...project.builderRendering.modulesView,moduleView]
    parentLayer.moduleIds.push(grpMdle.moduleId)

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        new BuilderRendering(moduleViews, project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes),
        project.runnerRendering
    )

    return { project:projectNew, layer}
}