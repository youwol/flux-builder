import './dependencies'

import { AppBuildViewObservables, AppDebugEnvironment, AppObservables, AppStore } from '../../app/builder-editor/builder-state'
import { SimpleModule } from '../common/simple-module'
import { Connection, instantiateProjectConnections } from '@youwol/flux-core'
import { environment } from '../common/dependencies'


AppDebugEnvironment.getInstance().debugOn = false

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

test('add 2 module and connections', () => {
    AppDebugEnvironment.getInstance().debugOn = false

    const [appStore, mdle0, mdle1] = setupProject({modulesCount:2})

    appStore.addConnection(new Connection(mdle0.outputSlots[0], mdle1.inputSlots[0]))

    expect(appStore.project.workflow.connections.length).toBe(1)
    const connection = appStore.project.workflow.connections[0]
    expect(appStore.allSubscriptions.has(connection)).toBeTruthy()
    appStore.undo()
    expect(appStore.allSubscriptions.size).toBe(0)
    expect(appStore.project.workflow.connections.length).toBe(0)
    appStore.redo()

    expect(appStore.project.workflow.connections.length).toBe(1)
    const connectionNew = appStore.project.workflow.connections[0]
    expect(appStore.allSubscriptions.has(connectionNew)).toBeTruthy()

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})



test('add 2 module and connections', () => {

    const [appStore, mdle0, mdle1] = setupProject({modulesCount:2})

    appStore.addConnection(new Connection(mdle0.outputSlots[0], mdle1.inputSlots[0]))

    expect(appStore.project.workflow.connections.length).toBe(1)
    const connection = appStore.project.workflow.connections[0]
    expect(appStore.allSubscriptions.has(connection)).toBeTruthy()
    appStore.undo()
    expect(appStore.allSubscriptions.size).toBe(0)
    expect(appStore.project.workflow.connections.length).toBe(0)
    appStore.redo()

    expect(appStore.project.workflow.connections.length).toBe(1)
    const connectionNew = appStore.project.workflow.connections[0]
    expect(appStore.allSubscriptions.has(connectionNew)).toBeTruthy()

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('delete connection', () => {

    const [appStore, mdle0, mdle1] = setupProject({modulesCount:2})

    appStore.addConnection(new Connection(mdle0.outputSlots[0], mdle1.inputSlots[0]))

    expect(appStore.project.workflow.connections.length).toBe(1)
    const connection = appStore.project.workflow.connections[0]

    appStore.deleteConnection(connection)

    expect(appStore.project.workflow.connections.length).toBe(0)
    expect(appStore.allSubscriptions.size).toBe(0)

    appStore.undo()
    expect(appStore.project.workflow.connections.length).toBe(1)
    expect(appStore.project.workflow.connections[0]).toEqual(connection)
    expect(appStore.allSubscriptions.has(connection)).toBeTruthy()

    appStore.redo()
    expect(appStore.project.workflow.connections.length).toBe(0)
    expect(appStore.allSubscriptions.size).toBe(0)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

test('instantiate connections', () => {

    const [appStore, mdle0, mdle1] = setupProject({modulesCount:2})

    const connectionsData = [
        {
            start: { moduleId: mdle0.moduleId, slotId: mdle0.outputSlots[0].slotId },
            end: { moduleId: mdle1.moduleId, slotId: mdle1.inputSlots[0].slotId }
        },
        {
            start: { moduleId: mdle0.moduleId, slotId: mdle0.outputSlots[0].slotId },
            end: { moduleId: mdle1.moduleId, slotId: mdle1.inputSlots[0].slotId },
            adaptor: { adaptorId: "adaptor0", mappingFunction: "return (input) => input" }
        },
        {
            start: { moduleId: "wrong", slotId: mdle0.outputSlots[0].slotId },
            end: { moduleId: mdle1.moduleId, slotId: mdle1.inputSlots[0].slotId },
            adaptor: { adaptorId: "adaptor0", mappingFunction: "return (input) => input" }
        },
        {
            start: { moduleId: mdle0.moduleId, slotId: "wrong" },
            end: { moduleId: mdle1.moduleId, slotId: mdle1.inputSlots[0].slotId },
            adaptor: { adaptorId: "adaptor0", mappingFunction: "return (input) => input" }
        },
        {
            start: { moduleId: mdle0.moduleId, slotId: mdle0.outputSlots[0].slotId },
            end: { moduleId: "wrong", slotId: mdle1.inputSlots[0].slotId },
            adaptor: { adaptorId: "adaptor0", mappingFunction: "return (input) => input" }
        },
        {
            start: { moduleId: mdle0.moduleId, slotId: mdle0.outputSlots[0].slotId },
            end: { moduleId: mdle1.moduleId, slotId: "wrong" },
            adaptor: { adaptorId: "adaptor0", mappingFunction: "return (input) => input" }
        }
    ]
    const connections = instantiateProjectConnections(appStore.allSubscriptions, connectionsData, appStore.project.workflow.modules)

    expect(connections.filter(c => c != undefined).length).toBe(2)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('create connections + module deletion', () => {

    AppDebugEnvironment.getInstance().debugOn = false

    const [appStore, mdle0, mdle1, mdle2, mdle3] = setupProject({modulesCount:4})

    appStore.addConnection(new Connection(mdle1.outputSlots[0], mdle0.inputSlots[0]))
    appStore.addConnection(new Connection(mdle2.outputSlots[0], mdle1.inputSlots[0]))
    appStore.addConnection(new Connection(mdle3.outputSlots[0], mdle2.inputSlots[0]))

    expect(appStore.project.workflow.connections.length).toBe(3)
    const c0 = appStore.project.workflow.connections[0]
    const c1 = appStore.project.workflow.connections[1]
    const c2 = appStore.project.workflow.connections[2]
    expect(appStore.allSubscriptions.size).toBe(3)
    expect(appStore.allSubscriptions.has(c0)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
    appStore.deleteModule(mdle0)
    expect(appStore.project.workflow.connections.length).toBe(2)
    expect(appStore.allSubscriptions.size).toBe(2)
    expect(appStore.allSubscriptions.get(c0)).toBeUndefined()
    expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
    appStore.deleteModule(mdle1)
    expect(appStore.project.workflow.connections.length).toBe(1)
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.get(c0)).toBeUndefined()
    expect(appStore.allSubscriptions.get(c1)).toBeUndefined()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
    appStore.undo()
    expect(appStore.project.workflow.connections.length).toBe(2)
    expect(appStore.allSubscriptions.size).toBe(2)
    expect(appStore.allSubscriptions.get(c0)).toBeUndefined()
    expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
    appStore.undo()
    expect(appStore.project.workflow.connections.length).toBe(3)
    expect(appStore.allSubscriptions.size).toBe(3)
    expect(appStore.allSubscriptions.has(c0)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
    appStore.redo()
    expect(appStore.project.workflow.connections.length).toBe(2)
    expect(appStore.allSubscriptions.size).toBe(2)
    expect(appStore.allSubscriptions.get(c0)).toBeUndefined()
    expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
    appStore.redo()
    expect(appStore.project.workflow.connections.length).toBe(1)
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.get(c0)).toBeUndefined()
    expect(appStore.allSubscriptions.get(c1)).toBeUndefined()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()
    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})


test('create connections + module update', () => {

    AppDebugEnvironment.getInstance().debugOn = false

    const [appStore, mdle0, mdle1, mdle2, mdle3] = setupProject({modulesCount:4})

    appStore.addConnection(new Connection(mdle1.outputSlots[0], mdle0.inputSlots[0]))
    appStore.addConnection(new Connection(mdle2.outputSlots[0], mdle1.inputSlots[0]))
    appStore.addConnection(new Connection(mdle3.outputSlots[0], mdle2.inputSlots[0]))

    appStore.updateModule(mdle1, new SimpleModule['Configuration']("new title", "", { property0: 1 }))

    const c0 = appStore.project.workflow.connections[0]
    const c1 = appStore.project.workflow.connections[1]
    const c2 = appStore.project.workflow.connections[2]

    expect(appStore.allSubscriptions.size).toBe(3)
    expect(appStore.allSubscriptions.has(c0)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c1)).toBeTruthy()
    expect(appStore.allSubscriptions.has(c2)).toBeTruthy()

    appStore.undo()

    expect(appStore.allSubscriptions.size).toBe(3)
    expect(appStore.allSubscriptions.has(c0))
    expect(appStore.allSubscriptions.has(c1))
    expect(appStore.allSubscriptions.has(c2))


    const c0New = appStore.project.workflow.connections[0]
    const c1New = appStore.project.workflow.connections[1]
    const c2New = appStore.project.workflow.connections[2]
    expect(c0 == c0New).toBe(true)
    expect(c1 == c1New).toBe(true)
    expect(c2 == c2New).toBe(true)
    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})