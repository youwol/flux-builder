import { Connection, Adaptor } from '@youwol/flux-core'
import './dependencies'
import {
    AppBuildViewObservables,
    AppDebugEnvironment,
    AppObservables,
    AppStore,
} from '../../app/builder-editor/builder-state'

import { SimpleModule } from '../common/simple-module'
import { environment } from '../common/dependencies'

test('add 2 module + connection + adaptator', () => {
    AppDebugEnvironment.getInstance().debugOn = false

    const appStore: AppStore = new AppStore(
        environment,
        AppObservables.getInstance(),
        AppBuildViewObservables.getInstance(),
    )
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    const workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules).toHaveLength(3)
    const mdle0 = workflow.modules[0]
    const mdle1 = workflow.modules[1]

    appStore.addConnection(
        new Connection(mdle0.outputSlots[0], mdle1.inputSlots[0]),
    )
    const connection = appStore.project.workflow.connections[0]
    const code = `
    return ({configuration,context,data}) => ({ 
        data: data , 
        context:context, 
        configuration:configuration
    })
    `
    const adaptor = new Adaptor('adaptorId', code)
    appStore.addAdaptor(adaptor, connection)
    const connectionAdapted = appStore.project.workflow.connections[0]
    expect(connectionAdapted.adaptor.toString()).toEqual(code)
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.undo()
    expect(appStore.project.workflow.connections[0]).toEqual(connection)
    expect(appStore.allSubscriptions.size).toBe(1)

    appStore.redo()
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.deleteAdaptor(connectionAdapted)
    expect(appStore.project.workflow.connections[0]).toEqual(connection)
    expect(appStore.allSubscriptions.size).toBe(1)
    // deleting adaptor create new connection
    expect(appStore.allSubscriptions.has(connection)).toBe(false)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBe(false)

    appStore.undo()
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.deleteConnection(connectionAdapted)
    expect(appStore.project.workflow.connections).toHaveLength(0)

    appStore.undo()
    expect(appStore.project.workflow.connections).toHaveLength(1)
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

test('add 2 module + connection + adaptator + update', () => {
    AppDebugEnvironment.getInstance().debugOn = false

    const appStore: AppStore = new AppStore(
        environment,
        AppObservables.getInstance(),
        AppBuildViewObservables.getInstance(),
    )
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    const workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules).toHaveLength(3)
    const mdle0 = workflow.modules[0]
    const mdle1 = workflow.modules[1]

    appStore.addConnection(
        new Connection(mdle0.outputSlots[0], mdle1.inputSlots[0]),
    )
    const connection = appStore.project.workflow.connections[0]
    const code = `
    return ({configuration,context,data}) => ({ 
        data: data , 
        context:context, 
        configuration:configuration
    })
    `
    const adaptor = new Adaptor('adaptorId', code)
    appStore.addAdaptor(adaptor, connection)
    const connectionAdapted = appStore.project.workflow.connections[0]

    //expect(connectionAdapted.adaptor.configuration.title).toEqual("adaptor title")
    //expect(connectionAdapted.adaptor.configuration.data.code).toEqual(code)

    const newCode = `
    return ({configuration,context,data}) => ({ 
        data: 0 , 
        context:context, 
        configuration:configuration
    })
    `

    appStore.updateAdaptor(connectionAdapted, newCode)
    const connectionAdaptedNew = appStore.project.workflow.connections[0]
    expect(connectionAdaptedNew.adaptor.toString()).toEqual(newCode)
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.has(connectionAdaptedNew)).toBeTruthy()

    appStore.undo()
    expect(appStore.project.workflow.connections[0]).toEqual(connectionAdapted)
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.has(connectionAdapted)).toBeTruthy()

    appStore.redo()
    expect(appStore.project.workflow.connections[0]).toEqual(
        connectionAdaptedNew,
    )
    expect(appStore.allSubscriptions.size).toBe(1)
    expect(appStore.allSubscriptions.has(connectionAdaptedNew)).toBeTruthy()

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})
