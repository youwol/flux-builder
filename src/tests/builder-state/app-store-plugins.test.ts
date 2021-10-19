
import  './dependencies'
import { AppStore, AppObservables,getPlugins, AppBuildViewObservables } from '../../app/builder-editor/builder-state'
import { SimpleModule2, SimplePlugin, testPack } from '../common/simple-module'
import { ModuleConfiguration, instantiateProjectModules,instantiateProjectPlugins, Workflow} from '@youwol/flux-core'
import { environment } from '../common/dependencies'
import { Subject } from 'rxjs'

function setupProject({modulesCount}:{modulesCount:number}): any {

  const appStore: AppStore = new AppStore(
      environment,
      AppObservables.getInstance(),
      AppBuildViewObservables.getInstance()
  )
  new Array(modulesCount).fill(0).map( () => appStore.addModule(SimpleModule2) )
  const workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(modulesCount+1)
  const mdles = workflow.modules.filter(mdle => mdle instanceof SimpleModule2.Module) as SimpleModule2.Module[]

  return [appStore, ...mdles]
}


test('instantiate plugins', () => {
  const workflow$ = new Subject<Workflow>()
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
  const factory = new Map( 
    Object.values(testPack.modules)
    .map( (mdleFact) => [( JSON.stringify({module:mdleFact['id'], pack:testPack.name})), mdleFact ])
  )
  const modules =  instantiateProjectModules(modulesData,factory, environment, workflow$)

  const pluginsData = [{
    moduleId : "unique-id-1",
    factoryId:{module:"SimplePlugin", pack:"flux-test"},
    parentModuleId:"unique-id-0",
    configuration:{
      title:"title plugin id 1",
      description:"",
      data:{
        property0:-1
      }
    }
  }]
  const factory2 = new Map( 
    Object.values(testPack.modules)
    .map( (mdleFact) => [( JSON.stringify({module:mdleFact['id'], pack:testPack.name})), mdleFact ])
  )
  const plugins =  instantiateProjectPlugins(pluginsData,modules,factory2, environment)
  
  expect(plugins.length).toEqual(1)
  
  const plugin = plugins[0]
  expect(plugin.inputSlots.length).toEqual(1)
  expect(plugin.Factory.uid).toEqual("SimplePlugin@flux-test")
  expect(plugin.inputSlots[0].moduleId).toEqual("unique-id-1")
  expect(plugin.inputSlots[0].slotId).toEqual("input0-plugin")
  expect(plugin.outputSlots.length).toEqual(0)
  expect(plugin.configuration.title).toEqual("title plugin id 1")
  expect(plugin.configuration.data.property0).toEqual(-1)
  expect(plugin.parentModule).toEqual(modules[0])
})

test('get available plugins', () => {/*
    AppDebugEnvironment.getInstance().debugOn = false

    let appStore : AppStore = AppStore.getInstance(environment)
    
    appStore.pluginsFactory = new Map(Object.values(testPack.modules).map( p=> [p["id"]+"@"+testPack.id, p] ))
    appStore.addModule(SimpleModule2)
    appStore.addModule(SimpleModule2)
    let plugins = appStore.getAvailablePlugins(appStore.project.workflow.modules[0])
    expect(plugins[0].factoryId).toEqual("simple-plugin@flux-pack-test")
    expect(plugins[0].pluginFactory).toEqual(testPack.plugins["simple-plugin"])

    let plugins2 = appStore.getAvailablePlugins(appStore.project.workflow.modules[1])
    expect(plugins2.length).toEqual(0)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)*/
  })

  
test('add module with plugin', () => {
  
  const [appStore, mdle] = setupProject({modulesCount:1})

  appStore.addPlugin(SimplePlugin, mdle)

  const plugins = getPlugins(mdle.moduleId, appStore.project)
  expect(plugins.length).toEqual(1)
  expect(appStore.project.workflow.plugins.length).toEqual(1)
  const plugin = appStore.project.workflow.plugins[0]
  expect(plugin.Factory.uid).toEqual("SimplePlugin@flux-test")
  expect(plugin.inputSlots.length).toEqual(1)
  expect(plugin.inputSlots[0].slotId).toEqual("input0-plugin")
  expect(plugin.outputSlots.length).toEqual(0)

  appStore.undo()
  const plugins2 = getPlugins(mdle.moduleId, appStore.project)
  expect(plugins2.length).toEqual(0)
  expect(appStore.project.workflow.plugins.length).toEqual(0)

  appStore.redo()
  expect(appStore.project.workflow.plugins.length).toEqual(1)
  expect(appStore.project.workflow.plugins[0]).toEqual(plugin)    
  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)

})

test('add module with plugin + module update', () => {
  // From bug https://gitlab.com/youwol/platform/-/issues/17
  
  let [appStore, mdle] = setupProject({modulesCount:1})
  let plugin = appStore.addPlugin(SimplePlugin, mdle )
  expect(plugin.configuration.data.property0).toEqual(0)
  expect(plugin.configuration.title).toEqual("SimplePlugin")
  appStore.updateModule(plugin, new ModuleConfiguration( {title:"new title",description:"", data:{property0:1} } ))

  plugin = appStore.getModule(plugin.moduleId)
  expect(plugin.configuration.data.property0).toEqual(1)  
  expect(plugin.configuration.title).toEqual("new title")

  appStore.updateModule(mdle, new ModuleConfiguration( {title:"new title",description:"", data:{property0:2} } ))

  mdle = appStore.getModule(mdle.moduleId)
  expect(mdle.configuration.data.property0).toEqual(2)

  plugin = appStore.getModule(plugin.moduleId)
  expect(plugin.configuration.data.property0).toEqual(1)
  expect(plugin.configuration.title).toEqual("new title")
})
