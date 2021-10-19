
import {instantiateProjectModules, Workflow } from '@youwol/flux-core'
import  './dependencies'

import { AppBuildViewObservables, AppDebugEnvironment, AppObservables, AppStore } from '../../app/builder-editor/builder-state'
import {SimpleModule, testPack} from '../common/simple-module'
import { environment } from '../common/dependencies'
import { Subject } from 'rxjs'


function setupProject({modulesCount}:{modulesCount:number}): any {

  const appStore: AppStore = new AppStore(
      environment,
      AppObservables.getInstance(),
      AppBuildViewObservables.getInstance()
  )
  new Array(modulesCount).fill(0).map( () => appStore.addModule(SimpleModule) )
  const workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(modulesCount+1)
  const mdles = workflow.modules.filter(mdle => mdle instanceof SimpleModule.Module) as SimpleModule.Module[]

  return [appStore, ...mdles]
}

test('add module', () => {
  AppDebugEnvironment.getInstance().debugOn = false

  const [appStore, mdle] = setupProject({modulesCount:1})
  let workflow = appStore.project.workflow

  expect(mdle.Factory.uid).toEqual("SimpleModule@flux-test")
  expect(mdle.inputSlots.length).toEqual(1)
  expect(mdle.inputSlots[0].slotId).toEqual("input0")
  expect(mdle.inputSlots[0].moduleId).toEqual(mdle.moduleId)
  expect(mdle.outputSlots.length).toEqual(1)
  expect(mdle.outputSlots[0].slotId).toEqual("output0")
  expect(mdle.outputSlots[0].moduleId).toEqual(mdle.moduleId)


  expect(appStore.project.builderRendering.modulesView.length).toEqual(1)
  const mdleView = appStore.project.builderRendering.modulesView[0]
  expect(mdleView.moduleId).toEqual(mdle.moduleId)

  expect(appStore.getRootComponent().getModuleIds().length).toEqual(1)
  expect(appStore.getRootComponent().getModuleIds()[0]).toEqual(mdle.moduleId)

  appStore.undo()
  workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(1)
  expect(appStore.getRootComponent().getModuleIds().length).toEqual(0)
  expect(appStore.project.builderRendering.modulesView.length).toEqual(0)

  appStore.redo()
  workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(2)
  expect(appStore.project.workflow.modules.find( mdle =>mdle instanceof SimpleModule.Module)).toEqual(mdle)
  expect(appStore.project.builderRendering.modulesView[0]).toEqual(mdleView)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

test('instantiate modules', () => {
  
  const modulesData = [{
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
  const workflow$ = new Subject<Workflow>()
  const factory = new Map( 
    Object.values(testPack['modules'])
    .map( (mdleFact) => [( JSON.stringify({module:mdleFact['id'], pack:testPack.name})), mdleFact ])
  )
  const modules =  instantiateProjectModules(modulesData,factory, environment, workflow$)

  expect(modules.length).toEqual(1)
  const mdle = modules[0]
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

  const [appStore, mdle] = setupProject({modulesCount:1})
  
  expect(mdle.configuration.title).toEqual("SimpleModule")
  expect(mdle.configuration.data.property0).toEqual(0)

  appStore.updateModule(mdle, new SimpleModule['Configuration']({title:"new title",description:"",data:{property0:1} }))

  expect(appStore.getRootComponent().getModuleIds().length).toEqual(1)
  const newMdle =  appStore.project.workflow.modules.find( mdle =>mdle instanceof SimpleModule.Module)
  expect(newMdle.configuration.data.property0).toEqual(1)
  expect(newMdle.configuration.title).toEqual("new title")

  appStore.undo()
  const prevMdle = appStore.project.workflow.modules.find( mdle => mdle instanceof SimpleModule.Module)
  expect(prevMdle).toEqual(mdle)
  appStore.redo()
  const newMdleRe = appStore.project.workflow.modules.find( mdle => mdle instanceof SimpleModule.Module)
  expect(newMdleRe).toEqual(newMdle)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

test('delete module', () => {

  const [appStore, mdle] = setupProject({modulesCount:1})

  appStore.deleteModule(mdle)
  expect(appStore.project.workflow.modules.length).toEqual(1)
  expect(appStore.getRootComponent().getModuleIds().length).toEqual(0)
  
  appStore.undo()
  expect(appStore.project.workflow.modules.find( mdle => mdle instanceof SimpleModule.Module)).toEqual(mdle)
  expect(appStore.getRootComponent().getModuleIds()[0]).toEqual(mdle.moduleId)
  appStore.redo()
  expect(appStore.project.workflow.modules.length).toEqual(1)
  expect(appStore.getRootComponent().getModuleIds().length).toEqual(0)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('delete modules', () => {
  
  const [appStore, mdle] = setupProject({modulesCount:1})

  appStore.deleteModules([])
  appStore.deleteModules([mdle])
  expect(appStore.project.workflow.modules.length).toEqual(1)
  expect(appStore.getRootComponent().getModuleIds().length).toEqual(0)
  
  appStore.undo()
  expect(appStore.project.workflow.modules.find( mdle => mdle instanceof SimpleModule.Module)).toEqual(mdle)
  expect(appStore.getRootComponent().getModuleIds()[0]).toEqual(mdle.moduleId)
  appStore.redo()
  expect(appStore.project.workflow.modules.length).toEqual(1)
  expect(appStore.getRootComponent().getModuleIds().length).toEqual(0)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('move module', () => {

  const [appStore, mdle] = setupProject({modulesCount:1})

  function getView(id){
    return appStore.project.builderRendering.modulesView.find(m => m.moduleId == id)
  }
  
  const moduleId = mdle.moduleId
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
  const mdle2 = appStore.project.workflow.modules.find( m => m instanceof SimpleModule.Module && m != mdle)
  appStore.moveModules([{moduleId:mdle2.moduleId,x:-10,y:20}]) 

  appStore.addGroup([mdle.moduleId,mdle2.moduleId])
  const activeModules = appStore.getActiveModulesView()
  //when the group_module is moved, included modules are actually not moved
  //their coordinates are relative to the referentiel inside the group
  appStore.moveModules([{moduleId:activeModules[0].moduleId,translation:[10,0]}])
  expect(getView(mdle.moduleId).xWorld).toEqual(10)
  expect(getView(mdle.moduleId).yWorld).toEqual(20)
  expect(getView(mdle2.moduleId).xWorld).toEqual(-10)
  expect(getView(mdle2.moduleId).yWorld).toEqual(20)
  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})
