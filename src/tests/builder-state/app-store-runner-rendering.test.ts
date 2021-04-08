
import  './dependencies'
import { AppDebugEnvironment, AppStore } from '../../app/builder-editor/builder-state'
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


test('set rendering layout', () => {

    AppDebugEnvironment.getInstance().debugOn = false
    let appStore : AppStore = AppStore.getInstance(environment)

    appStore.setRenderingLayout("<div> test rendering layout </div>")
    let layout = appStore.project.runnerRendering.layout
    expect(layout).toEqual("<div> test rendering layout </div>")
    appStore.undo()
    expect(appStore.project.runnerRendering.layout).toEqual("")
    appStore.redo()
    expect(appStore.project.runnerRendering.layout).toEqual(layout)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})
test('set rendering style', () => {

    AppDebugEnvironment.getInstance().debugOn = false
    let appStore : AppStore = AppStore.getInstance(environment)

    appStore.setRenderingStyle(".test{ background-color: black }")
    let style = appStore.project.runnerRendering.style
    expect(style).toEqual(".test{ background-color: black }")
    appStore.undo()
    expect(appStore.project.runnerRendering.style).toEqual("")
    appStore.redo()
    expect(appStore.project.runnerRendering.style).toEqual(style)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})
  