import { DescriptionBox, Project, BuilderRendering } from '@youwol/flux-core'

export function addDescriptionBox(
    descriptionBox: DescriptionBox,
    project: Project,
): Project {
    const boxes =
        project.builderRendering.descriptionsBoxes.concat(descriptionBox)

    const projectNew = new Project({
        ...project,
        ...{
            builderRendering: new BuilderRendering(
                project.builderRendering.modulesView,
                project.builderRendering.connectionsView,
                boxes,
            ),
        },
    })

    return projectNew
}

export function updateDescriptionBox(
    descriptionBox: DescriptionBox,
    project: Project,
): Project {
    const toKeeps = project.builderRendering.descriptionsBoxes.filter(
        (b) => b.descriptionBoxId != descriptionBox.descriptionBoxId,
    )
    const boxes = toKeeps.concat([descriptionBox])

    const projectNew = new Project({
        ...project,
        ...{
            builderRendering: new BuilderRendering(
                project.builderRendering.modulesView,
                project.builderRendering.connectionsView,
                boxes,
            ),
        },
    })

    return projectNew
}

export function deleteDescriptionBox(
    descriptionBox,
    project: Project,
): Project {
    const toKeeps = project.builderRendering.descriptionsBoxes.filter(
        (b) => b.descriptionBoxId != descriptionBox.descriptionBoxId,
    )
    const projectNew = new Project({
        ...project,
        ...{
            builderRendering: new BuilderRendering(
                project.builderRendering.modulesView,
                project.builderRendering.connectionsView,
                toKeeps,
            ),
        },
    })

    return projectNew
}
