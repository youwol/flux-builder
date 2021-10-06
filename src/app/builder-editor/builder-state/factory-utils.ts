import { Project, LayerTree, Workflow, WorkflowSchema, ProjectSchema, RequirementsSchema } from '@youwol/flux-core';



export function serializeWorkflow(workflow: Workflow) : WorkflowSchema {

    return {
        modules:workflow.modules.map( mdle=>({
            moduleId:mdle.moduleId,
            factoryId:{module:mdle.Factory.id, pack:mdle.Factory.packId},
            configuration: { title: mdle.configuration.title,
                             description:mdle.configuration.description,
                             data:Object.assign({},mdle.configuration.data) }
        })),
        connections:workflow.connections.map(c=>Object.assign( {
            end:{
                moduleId:c.end.moduleId,
                slotId:c.end.slotId,
            },
            start:{
                moduleId:c.start.moduleId,
                slotId:c.start.slotId,
            }},
            c.adaptor ? 
            {  adaptor : {
                adaptorId: c.adaptor.adaptorId,
                mappingFunction: c.adaptor.toString()
                }
            }: {})
        ),
        plugins:workflow.plugins.map( plugin=>({
            parentModuleId:plugin.parentModule.moduleId,
            moduleId:plugin.moduleId,
            factoryId:{module:plugin.Factory.id, pack:plugin.Factory.packId},
            configuration: { title: plugin.configuration.title,
                             description:plugin.configuration.description,
                             data:Object.assign({},plugin.configuration.data) }
        }))
    }
}
export function toProjectData(project:Project)/*ProjectSchema*/{

    return {
        name: project.name,
        schemaVersion:project.schemaVersion,
        description:project.description,
        builderRendering: {
            descriptionsBoxes: project.builderRendering.descriptionsBoxes.map(d =>
                ({ descriptionBoxId:d.descriptionBoxId,
                    descriptionHtml: d.descriptionHtml,
                    modulesId: d.modulesId,
                    title:d.title,
                    properties: {
                        color:d.properties.color
                    }
                })
                ),
            modulesView:project.builderRendering.modulesView.map( m =>({
                moduleId:m.moduleId,
                xWorld: m.xWorld,
                yWorld: m.yWorld
            }) ),
            connectionsView:project.builderRendering.connectionsView.map( c =>({
                connectionId:c.connectionId,
                wireless: c.wireless
            }) )
        },
        requirements: project.requirements as RequirementsSchema,
        workflow: serializeWorkflow(project.workflow),
        runnerRendering: {layout:"", style:""}
    }
}

export function toProjectURI(projectData: ProjectSchema): string{

    return encodeURIComponent(JSON.stringify(projectData))
}

export function fromProjectURI(uri: string): ProjectSchema {

    return JSON.parse(decodeURIComponent(uri))
}
