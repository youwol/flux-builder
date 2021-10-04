
import { Component, Project, RunnerRendering, Workflow } from '@youwol/flux-core'
import { LogLevel, AppDebugEnvironment } from './app-debug.environment'
import { applyHtmlCss, applyHtmlLayout } from './app-store-component'

export function setRenderingLayout( layout: string, project:Project ) : Project {

    let debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "set rendering layout", 
        object:{    layout: layout
        }
    })
    let workflow = applyHtmlLayout(project.workflow, layout)
    let projectNew = new Project({
        ...project,
        ...{
            workflow: workflow,
            runnerRendering: new RunnerRendering(layout,project.runnerRendering.style )
        }
    }) 
    
    return projectNew
}

export function setRenderingStyle(rootComponent: Component.Module, style, project: Project):Project{

    let debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "set rendering style", 
        object:{    style: style
        }
    })
    let workflow = applyHtmlCss(rootComponent, project.workflow, style)
    if(workflow==project.workflow)
        return project
        
    let projectNew = new Project({
        ...project,
        ...{
            workflow,
            runnerRendering: new RunnerRendering(project.runnerRendering.layout,style )
        }
    })
    
    return projectNew
}