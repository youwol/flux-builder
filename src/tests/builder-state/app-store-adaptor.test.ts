
import { Connection, Adaptor, AdaptorConfiguration, MockEnvironment } from '@youwol/flux-core'
import  './dependencies'
import { AppDebugEnvironment, AppStore } from '../../app/builder-editor/builder-state'

import { SimpleModule } from '../common/simple-module'
import { environment } from '../common/dependencies'


test('should return an empty workflow', () => {

  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(undefined)
  expect(appStore.project.workflow.modules).toEqual([])
  expect(appStore.project.workflow.connections).toEqual([])
  expect(appStore.project.workflow.plugins).toEqual([])
  expect(appStore.project.workflow.rootLayerTree.moduleIds).toEqual([])
  expect(appStore.project.workflow.rootLayerTree.children).toEqual([])
  expect(appStore.project.builderRendering.modulesView).toEqual([])
  })


test('add 2 module + connection + adaptator', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(2)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]

    appStore.addConnection( new Connection(mdle0.outputSlots[0],mdle1.inputSlots[0]) )
    let connection = appStore.project.workflow.connections[0]
    let code =`
    return ({configuration,context,data}) => ({ 
        data: data , 
        context:context, 
        configuration:configuration
    })
    `
    let confAdaptor = new AdaptorConfiguration( "adaptor title","", { code : code} )
    let adaptor = new Adaptor( "adaptorId", confAdaptor)
    appStore.addAdaptor(adaptor,connection)
    let connectionAdapted = appStore.project.workflow.connections[0]
    expect(connectionAdapted.adaptor.configuration).toEqual(confAdaptor)
    expect(appStore.allSubscriptions.size).toEqual(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.undo()
    expect(appStore.project.workflow.connections[0]).toEqual(connection)
    expect(appStore.allSubscriptions.size).toEqual(1)

    appStore.redo()
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    expect(appStore.allSubscriptions.size).toEqual(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.deleteAdaptor(connectionAdapted)
    expect(appStore.project.workflow.connections[0]).toEqual(connection)
    expect(appStore.allSubscriptions.size).toEqual(1)
    // deleting adaptor create new connection
    expect(appStore.allSubscriptions.has(connection) ).toEqual(false)
    expect(appStore.allSubscriptions.has(connectionAdapted) ).toEqual(false)

    appStore.undo()
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    expect(appStore.allSubscriptions.size).toEqual(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.deleteConnection(connectionAdapted)
    expect(appStore.project.workflow.connections.length).toEqual(0)

    appStore.undo()
    expect(appStore.project.workflow.connections.length).toEqual(1)
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })


test('add 2 module + connection + adaptator + update', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(2)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]

    appStore.addConnection( new Connection(mdle0.outputSlots[0],mdle1.inputSlots[0]) )
    let connection = appStore.project.workflow.connections[0]
    let code =`
    return ({configuration,context,data}) => ({ 
        data: data , 
        context:context, 
        configuration:configuration
    })
    `
    let confAdaptor = new AdaptorConfiguration( "adaptor title","", { code : code} )
    let adaptor = new Adaptor( "adaptorId", confAdaptor)
    appStore.addAdaptor(adaptor,connection)
    let connectionAdapted = appStore.project.workflow.connections[0]
    
    expect(connectionAdapted.adaptor.configuration.title).toEqual("adaptor title")
    expect(connectionAdapted.adaptor.configuration.data.code).toEqual(code)

    let newCode =`
    return ({configuration,context,data}) => ({ 
        data: 0 , 
        context:context, 
        configuration:configuration
    })
    `

    let newConf = new AdaptorConfiguration( "adaptor title2","", { code : newCode} )
    appStore.updateAdaptor(connectionAdapted, newConf)
    let connectionAdaptedNew = appStore.project.workflow.connections[0]
    expect(connectionAdaptedNew.adaptor.configuration).toEqual(newConf)
    expect(appStore.allSubscriptions.size).toEqual(1)
    expect(appStore.allSubscriptions.has(connectionAdaptedNew)).toBeTruthy()

    appStore.undo()
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    expect(appStore.allSubscriptions.size).toEqual(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.redo()
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdaptedNew)
    expect(appStore.allSubscriptions.size).toEqual(1)
    expect(appStore.allSubscriptions.has(connectionAdaptedNew)).toBeTruthy()

    appStore.updateProjectToIndexHistory(0,appStore.indexHistory)
  })

