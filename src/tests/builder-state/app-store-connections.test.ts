import  './dependencies'

import { AppDebugEnvironment, AppStore } from '../../app/builder-editor/builder-state'
import { SimpleModule } from '../common/simple-module'
import { Connection, instantiateProjectConnections } from '@youwol/flux-core'
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


test('add 2 module and connections', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)


    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(2)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]

    appStore.addConnection( new Connection(mdle0.outputSlots[0],mdle1.inputSlots[0] ) )
                                    
    expect(appStore.project.workflow.connections.length).toEqual(1)
    let connection = appStore.project.workflow.connections[0]
    expect(appStore.allSubscriptions.has(connection)).toBeTruthy()
    appStore.undo()
    expect(appStore.allSubscriptions.size).toEqual(0)
    expect(appStore.project.workflow.connections.length).toEqual(0)
    appStore.redo()

    expect(appStore.project.workflow.connections.length).toEqual(1)
    let connectionNew = appStore.project.workflow.connections[0]
    expect(appStore.allSubscriptions.has(connectionNew)).toBeTruthy()

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })

  

test('add 2 module and connections', () => {
  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)

  let workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(2)
  let mdle0 = workflow.modules[0]
  let mdle1 = workflow.modules[1]

  appStore.addConnection( new Connection(mdle0.outputSlots[0],mdle1.inputSlots[0] ) )
                                  
  expect(appStore.project.workflow.connections.length).toEqual(1)
  let connection = appStore.project.workflow.connections[0]
  expect(appStore.allSubscriptions.has(connection)).toBeTruthy()
  appStore.undo()
  expect(appStore.allSubscriptions.size).toEqual(0)
  expect(appStore.project.workflow.connections.length).toEqual(0)
  appStore.redo()

  expect(appStore.project.workflow.connections.length).toEqual(1)
  let connectionNew = appStore.project.workflow.connections[0]
  expect(appStore.allSubscriptions.has(connectionNew)).toBeTruthy()

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('delete connection', () => {
  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)

  let workflow = appStore.project.workflow
  let mdle0 = workflow.modules[0]
  let mdle1 = workflow.modules[1]

  appStore.addConnection( new Connection(mdle0.outputSlots[0],mdle1.inputSlots[0] ) )
                                  
  expect(appStore.project.workflow.connections.length).toEqual(1)
  let connection = appStore.project.workflow.connections[0]

  appStore.deleteConnection(connection)

  expect(appStore.project.workflow.connections.length).toEqual(0)
  expect(appStore.allSubscriptions.size).toEqual(0)

  appStore.undo()
  expect(appStore.project.workflow.connections.length).toEqual(1)
  expect(appStore.project.workflow.connections[0]).toEqual(connection)
  expect(appStore.allSubscriptions.has(connection)).toBeTruthy()

  appStore.redo()
  expect(appStore.project.workflow.connections.length).toEqual(0)
  expect(appStore.allSubscriptions.size).toEqual(0)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

test('instantiate connections', () => {

  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)

  let workflow = appStore.project.workflow
  let mdle0 = workflow.modules[0]
  let mdle1 = workflow.modules[1]

  let connectionsData = [
    { start:{ moduleId:mdle0.moduleId, slotId:mdle0.outputSlots[0].slotId},
      end:{ moduleId:mdle1.moduleId, slotId:mdle1.inputSlots[0].slotId}
    },
    { start:{ moduleId:mdle0.moduleId, slotId:mdle0.outputSlots[0].slotId},
      end:{ moduleId:mdle1.moduleId, slotId:mdle1.inputSlots[0].slotId},
      adaptor: {adaptorId:"adaptor0",configuration:{
        title:"adaptor0-title",
        description:"",
        data:{ code : "return (input) => input"}
      } }
    },
    { start:{ moduleId:"wrong", slotId:mdle0.outputSlots[0].slotId},
      end:{ moduleId:mdle1.moduleId, slotId:mdle1.inputSlots[0].slotId},
      adaptor: {adaptorId:"adaptor0",configuration:{
        title:"adaptor0-title",
        description:"",
        data:{ code : "return (input) => input"}
      } }
    },
    { start:{ moduleId:mdle0.moduleId, slotId:"wrong"},
      end:{ moduleId:mdle1.moduleId, slotId:mdle1.inputSlots[0].slotId},
      adaptor: {adaptorId:"adaptor0",configuration:{
        title:"adaptor0-title",
        description:"",
        data:{ code : "return (input) => input"}
      } }
    },
    { start:{ moduleId:mdle0.moduleId, slotId:mdle0.outputSlots[0].slotId},
      end:{ moduleId:"wrong", slotId:mdle1.inputSlots[0].slotId},
      adaptor: {adaptorId:"adaptor0",configuration:{
        title:"adaptor0-title",
        description:"",
        data:{ code : "return (input) => input"}
      } }
    },
    { start:{ moduleId:mdle0.moduleId, slotId:mdle0.outputSlots[0].slotId},
      end:{ moduleId:mdle1.moduleId, slotId:"wrong"},
      adaptor: {adaptorId:"adaptor0",configuration:{
        title:"adaptor0-title",
        description:"",
        data:{ code : "return (input) => input"}
      } }
    }
  ]
  let connections = instantiateProjectConnections( appStore.allSubscriptions,connectionsData, workflow.modules)
                         
  expect(connections.filter(c => c != undefined).length).toEqual(2)

  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('create connections + module deletion', () => {
  
  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)

  let workflow = appStore.project.workflow
  let mdle0 = workflow.modules[0]
  let mdle1 = workflow.modules[1]
  let mdle2 = workflow.modules[2]
  let mdle3 = workflow.modules[3]

  appStore.addConnection( new Connection(mdle1.outputSlots[0],mdle0.inputSlots[0] ) )
  appStore.addConnection( new Connection(mdle2.outputSlots[0],mdle1.inputSlots[0] ) )
  appStore.addConnection( new Connection(mdle3.outputSlots[0],mdle2.inputSlots[0] ) )
                         
  expect(appStore.project.workflow.connections.length).toEqual(3)
  let c0 = appStore.project.workflow.connections[0]
  let c1 = appStore.project.workflow.connections[1]
  let c2 = appStore.project.workflow.connections[2]
  expect(appStore.allSubscriptions.size).toEqual(3)
  expect(appStore.allSubscriptions.has(c0)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
  appStore.deleteModule(mdle0)
  expect(appStore.project.workflow.connections.length).toEqual(2)
  expect(appStore.allSubscriptions.size).toEqual(2)
  expect(appStore.allSubscriptions.get(c0)).toEqual(undefined)
  expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
  appStore.deleteModule(mdle1)
  expect(appStore.project.workflow.connections.length).toEqual(1)
  expect(appStore.allSubscriptions.size).toEqual(1)
  expect(appStore.allSubscriptions.get(c0)).toEqual(undefined)
  expect(appStore.allSubscriptions.get(c1)).toEqual(undefined)
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
  appStore.undo()
  expect(appStore.project.workflow.connections.length).toEqual(2)
  expect(appStore.allSubscriptions.size).toEqual(2)
  expect(appStore.allSubscriptions.get(c0)).toEqual(undefined)
  expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
  appStore.undo()
  expect(appStore.project.workflow.connections.length).toEqual(3)
  expect(appStore.allSubscriptions.size).toEqual(3)
  expect(appStore.allSubscriptions.has(c0)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
  appStore.redo()
  expect(appStore.project.workflow.connections.length).toEqual(2)
  expect(appStore.allSubscriptions.size).toEqual(2)
  expect(appStore.allSubscriptions.get(c0)).toEqual(undefined)
  expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
  appStore.redo()
  expect(appStore.project.workflow.connections.length).toEqual(1)
  expect(appStore.allSubscriptions.size).toEqual(1)
  expect(appStore.allSubscriptions.get(c0)).toEqual(undefined)
  expect(appStore.allSubscriptions.get(c1)).toEqual(undefined)
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('create connections + module update', () => {
  
  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)
  appStore.addModule(SimpleModule)

  let workflow = appStore.project.workflow
  let mdle0 = workflow.modules[0]
  let mdle1 = workflow.modules[1]
  let mdle2 = workflow.modules[2]
  let mdle3 = workflow.modules[3]

  appStore.addConnection( new Connection(mdle1.outputSlots[0],mdle0.inputSlots[0] ) )
  appStore.addConnection( new Connection(mdle2.outputSlots[0],mdle1.inputSlots[0] ) )
  appStore.addConnection( new Connection(mdle3.outputSlots[0],mdle2.inputSlots[0] ) )
                         
  appStore.updateModule(mdle1, new SimpleModule['Configuration']("new title","",{property0:1}))

  let c0 = appStore.project.workflow.connections[0]
  let c1 = appStore.project.workflow.connections[1]
  let c2 = appStore.project.workflow.connections[2]

  expect(appStore.allSubscriptions.size).toEqual(3)
  expect(appStore.allSubscriptions.has(c0)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
  expect(appStore.allSubscriptions.has(c2)).toBeTruthy()

  appStore.undo()

  expect(appStore.allSubscriptions.size).toEqual(3)
  expect(appStore.allSubscriptions.has(c0))
  expect(appStore.allSubscriptions.has(c1))
  expect(appStore.allSubscriptions.has(c2))


  let c0New = appStore.project.workflow.connections[0]
  let c1New = appStore.project.workflow.connections[1]
  let c2New = appStore.project.workflow.connections[2]
  expect(c0==c0New).toEqual(true)
  expect(c1==c1New).toEqual(true)
  expect(c2==c2New).toEqual(true)
  appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})