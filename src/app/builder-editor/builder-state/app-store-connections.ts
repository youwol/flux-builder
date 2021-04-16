import { Connection, Workflow, Project, Adaptor, AdaptorConfiguration, 
     ModuleFlux, BuilderRendering,} from '@youwol/flux-core';
     
import { AppDebugEnvironment, LogLevel } from './app-debug.environment';
import { Subscription } from 'rxjs';
import { uuidv4 } from './utils';


export function subscribeConnections(  allSubscriptions : Map<Connection, Subscription> , delta : {removedElements,createdElements },
    modules:Array<ModuleFlux> , plugins:Array<ModuleFlux>){

    let flatInputSlots  = modules.concat( plugins).reduce( (acc,e)=> acc.concat(e.inputSlots) , [])
    let flatOutputSlots = modules.concat( plugins).reduce( (acc,e)=> acc.concat(e.outputSlots) , [])

    delta.removedElements.forEach( (c:Connection) => {
        allSubscriptions.get(c).unsubscribe()
        allSubscriptions.delete(c)
    })
    delta.createdElements.forEach( (c:Connection) => {
        let slotOut      = flatOutputSlots.find(slot => slot.slotId==c.start.slotId && slot.moduleId == c.start.moduleId )
        let slotIn       = flatInputSlots.find(slot => slot.slotId==c.end.slotId && slot.moduleId == c.end.moduleId )
        let subscription =   slotOut.observable$.subscribe(d => slotIn.subscribeFct({connection:c,data:d}) )
        allSubscriptions.set(c,subscription )
    })
}


export function addConnection( connection: Connection, 
    project:Project ,
    allSubscriptions: Map<Connection,Subscription> ): Project{

    let debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "connection added", 
        object:{    connection: connection
        }
    })
    
    let modules = project.workflow.modules
    let connections = project.workflow.connections.concat(connection)
    let workflow   = new Workflow(  
        modules,
        connections,
        project.workflow.plugins,
        project.workflow.rootLayerTree )
        
    workflow   = new Workflow(  
        modules,
        connections,
        project.workflow.plugins,
        project.workflow.rootLayerTree )

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        project.builderRendering,
        project.runnerRendering
    )
    return projectNew
}

export function addAdaptor(connection : Connection,
    adaptor:Adaptor, 
    project:Project,
    allSubscriptions: Map<Connection,Subscription>) : Project{

    let connections = project.workflow.connections.filter(c => c!=connection)
    let newConnection = new Connection(connection.start,connection.end, adaptor )
    let workflow = new Workflow(
        project.workflow.modules,
        connections.concat(newConnection),
        project.workflow.plugins,        
        project.workflow.rootLayerTree )

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        project.builderRendering,
        project.runnerRendering
    )

    return projectNew
}
export function updateAdaptor(connection : Connection, mappingFunction : string, project:Project,
    allSubscriptions: Map<Connection,Subscription>) : Project {

    let connections = project.workflow.connections.filter(c => c!==connection)

    let adaptor = connection.adaptor
        ? new Adaptor(connection.adaptor.adaptorId,mappingFunction)
        : new Adaptor( uuidv4(), mappingFunction )
    let newConnection = new Connection(connection.start,connection.end, adaptor )
    let workflow = new Workflow(
        project.workflow.modules,
        connections.concat(newConnection),
        project.workflow.plugins,        
        project.workflow.rootLayerTree )

    let projectNew = new Project(
        project.name, 
        project.description,
        project.requirements,
        workflow,
        project.builderRendering,
        project.runnerRendering
    )
    return projectNew
}

export function deleteAdaptor(connection : Connection, project:Project,
        allSubscriptions: Map<Connection,Subscription>) : Project{

    let connections = project.workflow.connections.filter(c => c!=connection)
    let newConnection = new Connection(connection.start,connection.end, undefined )
    let workflow = new Workflow(
        project.workflow.modules,
        connections.concat(newConnection),
        project.workflow.plugins,        
        project.workflow.rootLayerTree )

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        project.builderRendering,
        project.runnerRendering
    )

    return projectNew
}

export function deleteConnection(connection : Connection, 
    project:Project,
    allSubscriptions: Map<Connection,Subscription> ) : Project{
        
    let connections = project.workflow.connections.filter(c => c!=connection)
    let workflow = new Workflow(
        project.workflow.modules,connections,
        project.workflow.plugins,        
        project.workflow.rootLayerTree )

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        workflow,
        project.builderRendering,
        project.runnerRendering
    )
    return projectNew
}

export function setConnectionView(connection: Connection, config: any, project:Project ){
    
    let connectViews = project.builderRendering.connectionsView
    .filter(c => c.connectionId != connection.connectionId )
    .concat( [{connectionId:connection.connectionId, wireless:config.wireless}])

    let builderRendering = new BuilderRendering(project.builderRendering.modulesView, connectViews, project.builderRendering.descriptionsBoxes)
    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        project.workflow,
        builderRendering,
        project.runnerRendering
    )
    return projectNew
}