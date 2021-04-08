
import * as _operators from 'rxjs/operators'
import {instantiateProjectModules } from '@youwol/flux-core'
import  './dependencies'

import { AppDebugEnvironment, AppStore } from '../../app/builder-editor/builder-state'
import {SimpleModule, testPack} from '../common/simple-module'
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

test('add module', () => {
  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)
  let workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(1)
  let mdle = appStore.project.workflow.modules[0]
  expect(mdle.Factory.uid).toEqual("SimpleModule@flux-test")
  expect(mdle.inputSlots.length).toEqual(1)
  expect(mdle.inputSlots[0].slotId).toEqual("input0")
  expect(mdle.inputSlots[0].moduleId).toEqual(mdle.moduleId)
  expect(mdle.outputSlots.length).toEqual(1)
  expect(mdle.outputSlots[0].slotId).toEqual("output0")
  expect(mdle.outputSlots[0].moduleId).toEqual(mdle.moduleId)


  expect(appStore.project.builderRendering.modulesView.length).toEqual(1)
  let mdleView = appStore.project.builderRendering.modulesView[0]
  expect(mdleView.moduleId).toEqual(mdle.moduleId)

  expect(appStore.project.workflow.rootLayerTree.moduleIds.length).toEqual(1)
  expect(appStore.project.workflow.rootLayerTree.moduleIds[0]).toEqual(mdle.moduleId)

  appStore.undo()
  workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(0)
  expect(appStore.project.workflow.rootLayerTree.moduleIds.length).toEqual(0)
  expect(appStore.project.builderRendering.modulesView.length).toEqual(0)

  appStore.redo()
  workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(1)
  expect(appStore.project.workflow.modules[0]).toEqual(mdle)
  expect(appStore.project.builderRendering.modulesView[0]).toEqual(mdleView)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

test('instantiate modules', () => {
  
  let modulesData = [{
    moduleId : "unique-id-0",
    factoryId:{module:"SimpleModule", pack:"flux-test"},
    configuration:{
      title:"title module id 0",
      description:"",
      data:{
        property0:1
      }
    }
  }]
  let factory = new Map( 
    Object.values(testPack['modules'])
    .map( (mdleFact) => [( JSON.stringify({module:mdleFact['id'], pack:testPack.name})), mdleFact ])
  )
  let modules =  instantiateProjectModules(modulesData,factory, environment, ()=>undefined)

  expect(modules.length).toEqual(1)
  let mdle = modules[0]
  expect(mdle.inputSlots.length).toEqual(1)
  expect(mdle.inputSlots[0].moduleId).toEqual("unique-id-0")
  expect(mdle.inputSlots[0].slotId).toEqual("input0")
  expect(mdle.outputSlots.length).toEqual(1)
  expect(mdle.outputSlots[0].moduleId).toEqual("unique-id-0")
  expect(mdle.outputSlots[0].slotId).toEqual("output0")
  expect(mdle.configuration.title).toEqual("title module id 0")
  expect(mdle.configuration.data.property0).toEqual(1)
})

test('update module', () => {

  AppDebugEnvironment.getInstance().debugOn = false
  
  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)
  let mdle = appStore.project.workflow.modules[0]
  expect(mdle.configuration.title).toEqual("SimpleModule")
  expect(mdle.configuration.data.property0).toEqual(0)

  appStore.updateModule(mdle, new SimpleModule['Configuration']({title:"new title",description:"",data:{property0:1} }))

  expect(appStore.project.workflow.rootLayerTree.moduleIds.length).toEqual(1)
  let newMdle =  appStore.project.workflow.modules[0]
  expect(newMdle.configuration.title).toEqual("new title")
  expect(newMdle.configuration.data.property0).toEqual(1)

  appStore.undo()
  expect(appStore.project.workflow.modules[0]).toEqual(mdle)
  appStore.redo()
  expect(appStore.project.workflow.modules[0]).toEqual(newMdle)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

test('delete module', () => {

  AppDebugEnvironment.getInstance().debugOn = false
  
  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)

  let mdle = appStore.project.workflow.modules[0]
  appStore.deleteModule(mdle)
  expect(appStore.project.workflow.modules.length).toEqual(0)
  expect(appStore.project.workflow.rootLayerTree.moduleIds.length).toEqual(0)
  
  appStore.undo()
  expect(appStore.project.workflow.modules[0]).toEqual(mdle)
  expect(appStore.project.workflow.rootLayerTree.moduleIds[0]).toEqual(mdle.moduleId)
  appStore.redo()
  expect(appStore.project.workflow.modules.length).toEqual(0)
  expect(appStore.project.workflow.rootLayerTree.moduleIds.length).toEqual(0)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('delete modules', () => {

  AppDebugEnvironment.getInstance().debugOn = false
  
  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)

  let mdle = appStore.project.workflow.modules[0]
  appStore.deleteModules([])
  appStore.deleteModules([mdle])
  expect(appStore.project.workflow.modules.length).toEqual(0)
  expect(appStore.project.workflow.rootLayerTree.moduleIds.length).toEqual(0)
  
  appStore.undo()
  expect(appStore.project.workflow.modules[0]).toEqual(mdle)
  expect(appStore.project.workflow.rootLayerTree.moduleIds[0]).toEqual(mdle.moduleId)
  appStore.redo()
  expect(appStore.project.workflow.modules.length).toEqual(0)
  expect(appStore.project.workflow.rootLayerTree.moduleIds.length).toEqual(0)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('move module', () => {

  AppDebugEnvironment.getInstance().debugOn = false
  
  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)

  function getView(id){
    return appStore.project.builderRendering.modulesView.find(m => m.moduleId == id)
  }
  let mdle = appStore.project.workflow.modules[0]
  let moduleId = mdle.moduleId
  expect(getView(moduleId).xWorld).toEqual(0)
  expect(getView(moduleId).yWorld).toEqual(0)
  appStore.moveModules([{moduleId:mdle.moduleId,x:10,y:20}])

  expect(getView(moduleId).xWorld).toEqual(10)
  expect(getView(moduleId).yWorld).toEqual(20)

  appStore.undo()
  expect(getView(moduleId).xWorld).toEqual(0)
  expect(getView(moduleId).yWorld).toEqual(0)

  appStore.redo()
  expect(getView(moduleId).xWorld).toEqual(10)
  expect(getView(moduleId).yWorld).toEqual(20)


  appStore.addModule(SimpleModule)
  let mdle2 = appStore.project.workflow.modules[1]
  appStore.moveModules([{moduleId:mdle2.moduleId,x:-10,y:20}])

  appStore.addGroup([mdle.moduleId,mdle2.moduleId])
  let activeModules = appStore.getActiveModulesView()
  //when the group_module is moved, included modules are actually not moved
  //their coordinates are relative to the referentiel inside the group
  appStore.moveModules([{moduleId:activeModules[0].moduleId,translation:[10,0]}])
  expect(getView(mdle.moduleId).xWorld).toEqual(10)
  expect(getView(mdle.moduleId).yWorld).toEqual(20)
  expect(getView(mdle2.moduleId).xWorld).toEqual(-10)
  expect(getView(mdle2.moduleId).yWorld).toEqual(20)
  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})
