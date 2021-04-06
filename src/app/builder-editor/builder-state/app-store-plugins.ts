
import { PluginFlow, Workflow, Project} from '@youwol/flux-core'
import { AppDebugEnvironment, LogLevel } from './app-debug.environment'
import { uuidv4 } from './utils'


export function getAvailablePlugins( mdle , pluginsFactory ) {

    let plugins = []
    Array.from(pluginsFactory.entries()).forEach( ([k,v]) => {
        if(mdle.factory && v.parentModule === mdle.factory.id)
            plugins.push({
                factoryId: k,pluginFactory:v
            })
    })
    return plugins
}

export function getPlugins( moduleId: string, project:Project) : Array<PluginFlow<any>> {

    return project.workflow.plugins.filter( plugin => 
        plugin.parentModule.moduleId === moduleId)
}

export function addPlugin( Factory, parentModule , project, ready$ ) {

    let debugSingleton = AppDebugEnvironment.getInstance()

    let configuration  = new Factory.Configuration()
    let moduleId       = Factory.id + "_" + uuidv4()
    let plugin         = new Factory.Module( {parentModule, moduleId, configuration, Factory, ready$ }) 
    
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "add plugin", 
        object:{ plugin: plugin, 
            pluginFactory: Factory }
    })

    let workflow   = new Workflow(  
        project.workflow.modules,
        project.workflow.connections,
        project.workflow.plugins.concat([plugin]),
        project.workflow.rootLayerTree)

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
