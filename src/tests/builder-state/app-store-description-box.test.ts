import  './dependencies'

import { AppDebugEnvironment, AppStore } from '../../app/builder-editor/builder-state'
import { DescriptionBox, DescriptionBoxProperties } from '@youwol/flux-core'
import { SimpleModule } from '../common/simple-module'
import { environment } from '../common/dependencies'


test('should return an empty workflow', () => {

  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)
  expect(appStore.project.workflow.modules).toEqual([])
  expect(appStore.project.workflow.connections).toEqual([])
  expect(appStore.project.workflow.plugins).toEqual([])
  expect(appStore.project.workflow.rootLayerTree.moduleIds).toEqual([])
  expect(appStore.project.workflow.rootLayerTree.children).toEqual([])
  expect(appStore.project.builderRendering.modulesView).toEqual([])
  })


test('add 2 module and connections + description box ', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(2)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]

    let properties = new DescriptionBoxProperties("blue")
    let descriptionBox = new DescriptionBox("descriptionBoxId","title",[mdle0.moduleId,mdle1.moduleId],"",properties)
    appStore.addDescriptionBox(descriptionBox)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.undo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(0)
    appStore.redo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.deleteModule(mdle0)
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    
    appStore.undo()
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })



test('add 2 module and connections + description box + delete', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(2)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]

    let properties = new DescriptionBoxProperties("blue")
    let descriptionBox = new DescriptionBox("descriptionBoxId","title",[mdle0.moduleId,mdle1.moduleId],"",properties)
    appStore.addDescriptionBox(descriptionBox)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.deleteDescriptionBox(descriptionBox)
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(0)
    appStore.undo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)
    appStore.redo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(0)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })


  


  test('add 2 module and connections + description box + update', () => {
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    appStore.addModule(SimpleModule)
    appStore.addModule(SimpleModule)

    let workflow = appStore.project.workflow
    expect(appStore.project.workflow.modules.length).toEqual(2)
    let mdle0 = workflow.modules[0]
    let mdle1 = workflow.modules[1]

    let properties = new DescriptionBoxProperties("blue")
    let descriptionBox = new DescriptionBox("descriptionBoxId","title",[mdle0.moduleId,mdle1.moduleId],"",properties)
    appStore.addDescriptionBox(descriptionBox)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    expect(appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    let propertiesNew = new DescriptionBoxProperties("red")
    let descriptionBoxNew = new DescriptionBox("descriptionBoxId","title2",[mdle0.moduleId],"",propertiesNew)
    appStore.updateDescriptionBox(descriptionBoxNew)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    let dBox = appStore.project.builderRendering.descriptionsBoxes[0]
    expect(dBox.title).toEqual("title2")
    expect(dBox.modulesId).toEqual([mdle0.moduleId])
    expect(dBox.properties).toEqual(propertiesNew)
    appStore.undo()
    expect( appStore.project.builderRendering.descriptionsBoxes[0]).toEqual(descriptionBox)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
  })