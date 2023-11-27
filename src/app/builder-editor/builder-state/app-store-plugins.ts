import { PluginFlux, Workflow, Project, IEnvironment } from '@youwol/flux-core'
import { AppDebugEnvironment, LogLevel } from './app-debug.environment'
import { uuidv4 } from './utils'

export function getAvailablePlugins(mdle, pluginsFactory) {
    const plugins = []
    Array.from(pluginsFactory.entries()).forEach(([k, v]) => {
        if (mdle.factory && v.parentModule === mdle.factory.id) {
            plugins.push({
                factoryId: k,
                pluginFactory: v,
            })
        }
    })
    return plugins
}

export function getPlugins(
    moduleId: string,
    project: Project,
): Array<PluginFlux<any>> {
    return project.workflow.plugins.filter(
        (plugin) => plugin.parentModule.moduleId === moduleId,
    )
}

export function addPlugin(
    Factory,
    parentModule,
    project,
    ready$,
    environment: IEnvironment,
) {
    const debugSingleton = AppDebugEnvironment.getInstance()

    const configuration = new Factory.Configuration()
    const moduleId = Factory.id + '_' + uuidv4()
    const plugin = new Factory.Module({
        parentModule,
        moduleId,
        configuration,
        Factory,
        ready$,
        environment,
    })

    debugSingleton.debugOn &&
        debugSingleton.logWorkflowBuilder({
            level: LogLevel.Info,
            message: 'add plugin',
            object: { plugin: plugin, pluginFactory: Factory },
        })

    const workflow = new Workflow({
        ...project.workflow,
        ...{
            plugins: project.workflow.plugins.concat([plugin]),
        },
    })

    const projectNew = new Project({
        ...project,
        ...{
            workflow,
        },
    })

    return projectNew
}
