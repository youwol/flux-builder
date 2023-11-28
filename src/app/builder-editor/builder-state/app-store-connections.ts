import {
    Connection,
    Workflow,
    Project,
    Adaptor,
    ModuleFlux,
    BuilderRendering,
} from '@youwol/flux-core'

import { AppDebugEnvironment, LogLevel } from './app-debug.environment'
import { Subscription } from 'rxjs'
import { uuidv4 } from './utils'

export function subscribeConnections(
    allSubscriptions: Map<Connection, Subscription>,
    delta: { removedElements; createdElements },
    modules: Array<ModuleFlux>,
    plugins: Array<ModuleFlux>,
) {
    const flatInputSlots = modules
        .concat(plugins)
        .reduce((acc, e) => acc.concat(e.inputSlots), [])
    const flatOutputSlots = modules
        .concat(plugins)
        .reduce((acc, e) => acc.concat(e.outputSlots), [])

    delta.removedElements.forEach((c: Connection) => {
        allSubscriptions.get(c).unsubscribe()
        allSubscriptions.delete(c)
    })
    delta.createdElements.forEach((c: Connection) => {
        const slotOut = flatOutputSlots.find(
            (slot) =>
                slot.slotId == c.start.slotId &&
                slot.moduleId == c.start.moduleId,
        )
        const slotIn = flatInputSlots.find(
            (slot) =>
                slot.slotId == c.end.slotId && slot.moduleId == c.end.moduleId,
        )
        const subscription = slotOut.observable$.subscribe((d) =>
            slotIn.subscribeFct({ connection: c, message: d }),
        )
        allSubscriptions.set(c, subscription)
    })
}

export function addConnection(
    connection: Connection,
    project: Project,
    allSubscriptions: Map<Connection, Subscription>,
): Project {
    const debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: 'connection added',
            object: { connection: connection },
        })

    const modules = project.workflow.modules
    const connections = project.workflow.connections.concat(connection)
    let workflow = new Workflow({
        modules,
        connections,
        plugins: project.workflow.plugins,
    })

    workflow = new Workflow({
        modules,
        connections,
        plugins: project.workflow.plugins,
    })

    const projectNew = new Project({
        ...project,
        ...{ workflow: workflow },
    })
    return projectNew
}

export function addAdaptor(
    connection: Connection,
    adaptor: Adaptor,
    project: Project,
    allSubscriptions: Map<Connection, Subscription>,
): Project {
    const connections = project.workflow.connections.filter(
        (c) => c != connection,
    )
    const newConnection = new Connection(
        connection.start,
        connection.end,
        adaptor,
    )
    const workflow = new Workflow({
        ...project.workflow,
        ...{
            connections: connections.concat(newConnection),
        },
    })

    const projectNew = new Project({
        ...project,
        ...{ workflow },
    })

    return projectNew
}
export function updateAdaptor(
    connection: Connection,
    mappingFunction: string,
    project: Project,
    allSubscriptions: Map<Connection, Subscription>,
): Project {
    const connections = project.workflow.connections.filter(
        (c) => c !== connection,
    )

    const adaptor = connection.adaptor
        ? new Adaptor(connection.adaptor.adaptorId, mappingFunction)
        : new Adaptor(uuidv4(), mappingFunction)
    const newConnection = new Connection(
        connection.start,
        connection.end,
        adaptor,
    )
    const workflow = new Workflow({
        ...project.workflow,
        ...{
            connections: connections.concat(newConnection),
        },
    })

    const projectNew = new Project({
        ...project,
        ...{ workflow },
    })
    return projectNew
}

export function deleteAdaptor(
    connection: Connection,
    project: Project,
    allSubscriptions: Map<Connection, Subscription>,
): Project {
    const connections = project.workflow.connections.filter(
        (c) => c != connection,
    )
    const newConnection = new Connection(
        connection.start,
        connection.end,
        undefined,
    )
    const workflow = new Workflow({
        ...project.workflow,
        ...{
            connections: connections.concat(newConnection),
        },
    })

    const projectNew = new Project({
        ...project,
        ...{ workflow },
    })

    return projectNew
}

export function deleteConnection(
    connection: Connection,
    project: Project,
    allSubscriptions: Map<Connection, Subscription>,
): Project {
    const connections = project.workflow.connections.filter(
        (c) => c != connection,
    )
    const workflow = new Workflow({
        ...project.workflow,
        ...{
            connections,
        },
    })

    const projectNew = new Project({
        ...project,
        ...{ workflow },
    })
    return projectNew
}

export function setConnectionView(
    connection: Connection,
    config: any,
    project: Project,
) {
    const connectViews = project.builderRendering.connectionsView
        .filter((c) => c.connectionId != connection.connectionId)
        .concat([
            {
                connectionId: connection.connectionId,
                wireless: config.wireless,
            },
        ])

    const builderRendering = new BuilderRendering(
        project.builderRendering.modulesView,
        connectViews,
        project.builderRendering.descriptionsBoxes,
    )
    const projectNew = new Project({
        ...project,
        ...{ builderRendering },
    })

    return projectNew
}
