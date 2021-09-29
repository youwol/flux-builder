import { DescriptionBox, Project, BuilderRendering } from '@youwol/flux-core'



export function addDescriptionBox(descriptionBox : DescriptionBox, project: Project) : Project{

    let boxes = project.builderRendering.descriptionsBoxes.concat(descriptionBox)

    let projectNew = new Project({
        ...project,
        ...{
            builderRendering:new BuilderRendering(project.builderRendering.modulesView,project.builderRendering.connectionsView,boxes)
        }
    })

    return projectNew
    }

export function updateDescriptionBox(descriptionBox : DescriptionBox, project: Project) : Project{
    
    let toKeeps = project.builderRendering.descriptionsBoxes.filter(
        b => b.descriptionBoxId != descriptionBox.descriptionBoxId
    )
    let boxes = toKeeps.concat([descriptionBox])

    let projectNew = new Project({
        ...project,
        ...{
            builderRendering:new BuilderRendering(project.builderRendering.modulesView,project.builderRendering.connectionsView,boxes)
        }
    })

    return projectNew    
}

export function deleteDescriptionBox(descriptionBox, project: Project) : Project{
    
    let toKeeps = project.builderRendering.descriptionsBoxes.filter(
        b => b.descriptionBoxId != descriptionBox.descriptionBoxId
    )
    let projectNew = new Project({
        ...project,
        ...{
            builderRendering:new BuilderRendering(project.builderRendering.modulesView,project.builderRendering.connectionsView,toKeeps)
        }
    })

    return projectNew    
}

