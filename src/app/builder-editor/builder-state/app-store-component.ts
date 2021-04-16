
import { ModuleView, Workflow, BuilderRendering, Project, GroupModules,
    Connection, LayerTree, SlotRef, Adaptor } from '@youwol/flux-core'

import { AppDebugEnvironment } from './app-debug.environment'
import { uuidv4 } from './utils'
import { isGroupingModule } from './app-store-modules'
import { cloneLayerTree } from './app-store-layer'




export function addRemoteComponent( component, modulesFactory, coors, project: Project , activeLayerId, 
    workflowGetter, ready$ : any, environment: any) {
    
    let debugSingleton = AppDebugEnvironment.getInstance()

    let getAllLayerIds = ( layer: LayerTree):Array<string> => 
        [layer.layerId].concat( layer.children.map(child => getAllLayerIds(child)).reduce( (acc,e)=>acc.concat(e),[]))

    let layerIdsMap = getAllLayerIds(component.workflow.rootLayerTree).map( layerId => [layerId, uuidv4()])
    .reduce( (acc,[originalId, newId]) => Object.assign({}, acc, {[originalId]:newId}), {})

    let moduleIdsMap = [...component.workflow.modules,...component.workflow.plugins].map( moduleData => {
        let Factory = modulesFactory.get(moduleData.factoryId)
        let moduleId = isGroupingModule(moduleData) ?
            Factory.id+"_"+layerIdsMap[moduleData.moduleId.split(Factory.id+"_")[1]]:
            Factory.id + "_" + uuidv4()

        return [moduleData.moduleId,moduleId]
    })
    .reduce( (acc,[originalId, newId]) => Object.assign({}, acc, {[originalId]:newId}), {})


    let baseData = (moduleData, Factory) => {

        let conf    = new Factory.Configuration({
            title:         moduleData.configuration.title,
            description:   moduleData.configuration.description,
            data:          new Factory.PersistentData(moduleData.configuration.data)
        })
        return {
            moduleId:          moduleIdsMap[moduleData.moduleId], 
            configuration:     conf, 
            ready$:            ready$,
            Factory:           Factory,
            environment:       environment
        }
    } 

    let newModules = component.workflow.modules.map(moduleData => {

        let Factory = modulesFactory.get(moduleData.factoryId)
        let suppData = isGroupingModule(moduleData) ? 
        {workflowGetter, layerId:layerIdsMap[moduleData.moduleId.split(Factory.id+"_")[1]] } : {}

        let mdle  = new Factory.Module( Object.assign(baseData(moduleData,Factory),suppData) )      
        return mdle 
    } )
    let newPlugins = component.workflow.plugins.map(pluginData => {

        let Factory = modulesFactory.get(pluginData.factoryId)
        let parentModule = newModules.find( m => m.moduleId === moduleIdsMap[pluginData.parentModuleId] )
        let mdle  = new Factory.Module(Object.assign(baseData(pluginData,Factory),{parentModule})  )                        
        return mdle 
    } )
    let cloneAndMapLayerTree = (layerTree: LayerTree ) :LayerTree => 
        new LayerTree(layerIdsMap[layerTree.layerId],layerTree.title,layerTree.children.map(c => cloneAndMapLayerTree(c)),
            layerTree.moduleIds.map( mId=>moduleIdsMap[mId]))
            
    let newLayerTree = cloneAndMapLayerTree(component.workflow.rootLayerTree)

    let newConnections = component.workflow.connections.map( (c:Connection) => {
        return new Connection(
            new SlotRef(c.start.slotId, moduleIdsMap[c.start.moduleId]),
            new SlotRef(c.end.slotId, moduleIdsMap[c.end.moduleId]),
            c.adaptor 
                ? new Adaptor(uuidv4(), c.adaptor.mappingFunction) 
                : undefined)
    })

    let newModulesView = component.builderRendering.modulesView.map(
        (mView : ModuleView)=> {
            let pos = mView.moduleId.split("_")[1] == component.workflow.rootLayerTree.layerId ? 
                coors :
                [mView.xWorld,mView.yWorld]
            return new ModuleView(moduleIdsMap[mView.moduleId],pos[0],pos[1],
                newModules.find( m=>m.moduleId == moduleIdsMap[mView.moduleId]).Factory) 
        }
    )
    let rootComponent = newModules.find( mdle => mdle instanceof GroupModules.Module && mdle.layerId == newLayerTree.layerId) 
    let clonedLayerTree = cloneLayerTree(project.workflow.rootLayerTree)
    let activeLayer = clonedLayerTree.getLayerRecursive((layer)=> layer.layerId == activeLayerId)
    activeLayer.children.push(newLayerTree)
    activeLayer.moduleIds.push(rootComponent.moduleId)
    let workflow   = new Workflow(  project.workflow.modules.concat(newModules),
                                    project.workflow.connections.concat(newConnections),
                                    project.workflow.plugins.concat(newPlugins),
                                    clonedLayerTree)
                                    
    let builderRendering = new BuilderRendering(
        project.builderRendering.modulesView.concat(newModulesView),
        project.builderRendering.connectionsView,
        project.builderRendering.descriptionsBoxes
        )

    if(component.runnerRendering){
        
        let newLayout = component.runnerRendering.layout 
        Object.entries(moduleIdsMap).forEach( ([originalId, newId]) => {
            newLayout = newLayout.replace(originalId, newId)
        })        
    
        rootComponent.rendering = { layout : newLayout, style: component.runnerRendering.style}
    }
    
    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        builderRendering,
        project.runnerRendering
    )

    return projectNew
}
