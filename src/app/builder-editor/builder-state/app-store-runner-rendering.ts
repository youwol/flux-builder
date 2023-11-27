import { Component, Project } from '@youwol/flux-core'
import { LogLevel, AppDebugEnvironment } from './app-debug.environment'
import { applyHtmlCss, applyHtmlLayout } from './app-store-component'

export function setRenderingLayout(layout: string, project: Project): Project {
    const debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: 'set rendering layout',
            object: { layout: layout },
        })
    const workflow = applyHtmlLayout(project.workflow, layout)
    const projectNew = new Project({
        ...project,
        ...{
            workflow: workflow,
        },
    })

    return projectNew
}

export function setRenderingStyle(
    rootComponent: Component.Module,
    style,
    project: Project,
): Project {
    const debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: 'set rendering style',
            object: { style: style },
        })
    const workflow = applyHtmlCss(rootComponent, project.workflow, style)
    if (workflow == project.workflow) {
        return project
    }

    const projectNew = new Project({
        ...project,
        ...{
            workflow,
        },
    })

    return projectNew
}
