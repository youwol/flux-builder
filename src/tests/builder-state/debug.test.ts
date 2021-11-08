import  './dependencies'
import { AppDebugEnvironment, AppObservables,
  AppBuildViewObservables, LogLevel } from '../../app/builder-editor/builder-state/index'


test('test info debugs', () => {

  const debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn = true
  const messages = []
  console.log = function (a1,a2) {
    messages.push({message:a1, object:a2})
  }

  debugSingleton.logAppTopic({level:LogLevel.Info, message: "test", object:{index:0}})
  debugSingleton.logObservable({level:LogLevel.Info, message: "test", object:{index:1}})
  debugSingleton.logRenderTopic({level:LogLevel.Info, message: "test", object:{index:2}})
  debugSingleton.logWorkflowBuilder({level:LogLevel.Info, message: "test", object:{index:3}})
  debugSingleton.logWorkflowView({level:LogLevel.Info, message: "test", object:{index:4}})

  const targets=[
    {message:"#App",object:{level:1,message:"test",object:{index:0}}},
    {message:"#Observables",object:{level:1,message:"test",object:{index:1}}},
    {message:"#Render",object:{level:1,message:"test",object:{index:2}}},
    {message:"#WorkflowBuilder",object:{level:1,message:"test",object:{index:3}}},
    {message:"#WorkflowView",object:{level:1,message:"test",object:{index:4}}}
  ]
  targets.forEach( (target,i)=>{
    expect(target.message).toEqual(messages[i].message)
    expect(target.object.level).toEqual(messages[i].object.level)
    expect(target.object.message).toEqual(messages[i].object.message)
    expect(target.object.object.index).toEqual(messages[i].object.object.index)
  })
  })

test('test log level debugs', () => {

  const debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn = true
  const messages = []
  console.log = function (a1,a2) {
    messages.push({message:a1, object:a2})
  }
  console.error = function (a1,a2) {
    messages.push({message:a1, object:a2})
  }

  debugSingleton.observableLevel = LogLevel.Info
  debugSingleton.logObservable({level:LogLevel.Debug, message: "test", object:{index:0}})
  debugSingleton.logObservable({level:LogLevel.Info, message: "test", object:{index:1}})
  debugSingleton.logObservable({level:LogLevel.Error, message: "test", object:{index:2}})

  expect(messages.map(m => m.object.object.index)).toEqual([1,2])
  })

test('test app observables logs', () => {

  const debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn = true
  const messages = []
  console.log = function (a1,a2) {
    messages.push({message:a1, object:a2})
  }
  console.error = function (a1,a2) {
    messages.push({message:a1, object:a2})
  }

  const app$ = AppObservables.getInstance()
  app$.ready$.next(true)

  expect(messages).toHaveLength(1) 
  })


test('test plotters observables logs', () => {

  const debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn = true
  const messages = []
  console.log = function (a1,a2) {
    messages.push({message:a1, object:a2})
  }
  console.error = function (a1,a2) {
    messages.push({message:a1, object:a2})
  }

  const app$ = AppBuildViewObservables.getInstance()
  app$.modulesDrawn$.next(true)

  expect(messages).toHaveLength(1)
  })

