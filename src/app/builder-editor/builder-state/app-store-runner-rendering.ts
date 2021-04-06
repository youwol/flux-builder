
import { Project, RunnerRendering } from '@youwol/flux-core'
import { LogLevel, AppDebugEnvironment } from './app-debug.environment'

export function setRenderingLayout( layout, project:Project ) : Project {

    let debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "set rendering layout", 
        object:{    layout: layout
        }
    })

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        project.workflow,
        project.builderRendering,
        new RunnerRendering(layout,project.runnerRendering.style )
    )
    return projectNew
}

export function setRenderingStyle(style, project: Project):Project{

    let debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "set rendering style", 
        object:{    style: style
        }
    })

    let projectNew = new Project( 
        project.name,
        project.description,
        project.requirements,
        project.workflow,
        project.builderRendering,
        new RunnerRendering(project.runnerRendering.layout,style )
    )
    return projectNew
}