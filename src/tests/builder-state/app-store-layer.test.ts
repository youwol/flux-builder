import  './dependencies'
import { AppDebugEnvironment, AppStore } from '../../app/builder-editor/builder-state'
import { LayerTree, Connection, instantiateProjectLayerTree } from '@youwol/flux-core'
import { SimpleModule } from '../common/simple-module'
import { environment } from '../common/dependencies'


test('should return an empty workflow', () => {

  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  expect(appStore.project.workflow.modules).toEqual([])
  expect(appStore.project.workflow.connections).toEqual([])
  expect(appStore.project.workflow.plugins).toEqual([])
  expect(appStore.project.workflow.rootLayerTree.moduleIds).toEqual([])
  expect(appStore.project.workflow.rootLayerTree.children).toEqual([])
  expect(appStore.project.builderRendering.modulesView).toEqual([])
  })

test('instantiate layer', () => {

    AppDebugEnvironment.getInstance().debugOn = false
    let layerData = {
        layerId : "root",
        title : "",
        children : [
            {   layerId : "child0",
                title : "child0-title",
                children:[],
                moduleIds:[]
            }
        ],
        moduleIds: ["a","b","c"]
    }
    let layer : LayerTree = instantiateProjectLayerTree(layerData)
    expect( layer.layerId).toEqual(layerData.layerId)
    expect( layer.title).toEqual(layerData.title)
    expect( layer.children[0].layerId).toEqual(layerData.children[0].layerId)
    expect( layer.children[0].title).toEqual(layerData.children[0].title)
    expect( layer.children[0].children).toEqual(layerData.children[0].children)
})
  

test('layer 2 modules no slots', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(2)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]

    appStore.addGroup([mdle0.moduleId,mdle1.moduleId])
    let layerId = appStore.project.workflow.rootLayerTree.children[0].layerId
    let layer = appStore.getLayer(layerId)

    expect( layer.moduleIds).toEqual([mdle0.moduleId,mdle1.moduleId])
    appStore.undo()

    let layerNone = appStore.getLayer(layerId)
    expect( layerNone).toEqual(undefined)

    appStore.redo()
    expect( appStore.getLayer(layerId)).toEqual(layer)
    expect( appStore.getLayer(layerId).moduleIds.length).toEqual(2)
    appStore.deleteModule(mdle0)

    expect( appStore.getLayer(layerId).moduleIds.length).toEqual(1)

    appStore.undo()

    expect( layer.moduleIds).toEqual([mdle0.moduleId,mdle1.moduleId])
    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })



  test('layer 3 modules + IO slots', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(3)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]
    let mdle2 = workflow.modules[2]

    appStore.addConnection( new Connection(mdle1.outputSlots[0],mdle0.inputSlots[0] ) )
    appStore.addConnection( new Connection(mdle2.outputSlots[0],mdle1.inputSlots[0] ) )

    appStore.addGroup([mdle1.moduleId])
    let layerId = appStore.project.workflow.rootLayerTree.children[0].layerId
    let layer = appStore.getLayer(layerId)

    expect( layer.moduleIds).toEqual([mdle1.moduleId])

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })

