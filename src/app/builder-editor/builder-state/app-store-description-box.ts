import { DescriptionBox, Project, BuilderRendering } from '@youwol/flux-core'



export function addDescriptionBox(descriptionBox : DescriptionBox, project: Project) : Project{

    let boxes = project.builderRendering.descriptionsBoxes.concat(descriptionBox)

    let projectNew = new Project(
        project.name,
        project.description, 
        project.requirements, 
        project.workflow,
        new BuilderRendering(project.builderRendering.modulesView,project.builderRendering.connectionsView,boxes),
        project.runnerRendering)

    return projectNew
    }

export function updateDescriptionBox(descriptionBox : DescriptionBox, project: Project) : Project{
    
    let toKeeps = project.builderRendering.descriptionsBoxes.filter(
        b => b.descriptionBoxId != descriptionBox.descriptionBoxId
    )
    let boxes = toKeeps.concat([descriptionBox])

    let projectNew = new Project(
        project.name,
        project.description, 
        project.requirements, 
        project.workflow,
        new BuilderRendering(project.builderRendering.modulesView,project.builderRendering.connectionsView,boxes),
        project.runnerRendering)

    return projectNew    
}

export function deleteDescriptionBox(descriptionBox, project: Project) : Project{
    
    let toKeeps = project.builderRendering.descriptionsBoxes.filter(
        b => b.descriptionBoxId != descriptionBox.descriptionBoxId
    )
    let projectNew = new Project(
        project.name,
        project.description, 
        project.requirements, 
        project.workflow,
        new BuilderRendering(project.builderRendering.modulesView,project.builderRendering.connectionsView,toKeeps),
        project.runnerRendering)

    return projectNew    
}

