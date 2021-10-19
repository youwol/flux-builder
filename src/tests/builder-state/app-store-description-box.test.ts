import  './dependencies'

import { AppBuildViewObservables, AppDebugEnvironment, AppObservables, AppStore } from '../../app/builder-editor/builder-state'
import { DescriptionBox, DescriptionBoxProperties } from '@youwol/flux-core'
import { SimpleModule } from '../common/simple-module'
import { environment } from '../common/dependencies'


function setupProject({modulesCount}:{modulesCount:number}): any {

  const appStore: AppStore = new AppStore(
      environment,
      AppObservables.getInstance(),
      AppBuildViewObservables.getInstance()
  )
  new Array(modulesCount).fill(0).map( () => appStore.addModule(SimpleModule) )
  const workflow = appStore.project.workflow
  expect(appStore.project.workflow.modules.length).toEqual(modulesCount+1)
  const mdles = workflow.modules.filter(mdle => mdle instanceof SimpleModule.Module) as SimpleModule.Module[]

  return [appStore, ...mdles]
}


test('add 2 module and connections + description box ', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    const [appStore, mdle0, mdle1] = setupProject({modulesCount:2})

    const properties = new DescriptionBoxProperties("blue")
    const descriptionBox = new DescriptionBox("descriptionBoxId","title",[mdle0.moduleId,mdle1.moduleId],"",properties)
    appStore.addDescriptionBox(descriptionBox)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.undo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(0)
    appStore.redo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.deleteModule(mdle0)
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(1)
    
    appStore.undo()
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })



test('add 2 module and connections + description box + delete', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    const [appStore, mdle0, mdle1] = setupProject({modulesCount:2})

    const properties = new DescriptionBoxProperties("blue")
    const descriptionBox = new DescriptionBox("descriptionBoxId","title",[mdle0.moduleId,mdle1.moduleId],"",properties)
    appStore.addDescriptionBox(descriptionBox)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.deleteDescriptionBox(descriptionBox)
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(0)
    appStore.undo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)
    appStore.redo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(0)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })


  


  test('add 2 module and connections + description box + update', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    const [appStore, mdle0, mdle1] = setupProject({modulesCount:2})

    const properties = new DescriptionBoxProperties("blue")
    const descriptionBox = new DescriptionBox("descriptionBoxId","title",[mdle0.moduleId,mdle1.moduleId],"",properties)
    appStore.addDescriptionBox(descriptionBox)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    const propertiesNew = new DescriptionBoxProperties("red")
    const descriptionBoxNew = new DescriptionBox("descriptionBoxId","title2",[mdle0.moduleId],"",propertiesNew)
    appStore.updateDescriptionBox(descriptionBoxNew)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toBe(1)
    const dBox = appStore.project.builderRendering.descriptionsBoxes[0]
    expect(dBox.title).toBe("title2")
    expect(dBox.modulesId).toEqual([mdle0.moduleId])
    expect(dBox.properties).toEqual(propertiesNew)
    appStore.undo()
    expect( appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })