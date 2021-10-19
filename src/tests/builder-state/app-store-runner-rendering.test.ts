
import  './dependencies'
import { AppBuildViewObservables, AppDebugEnvironment, AppObservables, AppStore } from '../../app/builder-editor/builder-state'
import { environment } from '../common/dependencies'


function setupProject(): AppStore {

  const appStore: AppStore = new AppStore(
      environment,
      AppObservables.getInstance(),
      AppBuildViewObservables.getInstance()
  )

  return appStore
}


test('set rendering layout', () => {

    const appStore : AppStore = setupProject()
    const html = `<div id='${appStore.rootComponentId}' class='flux-element flux-component'><div> test rendering layout </div></div>`
    appStore.setRenderingLayout(html)
    
    let outerHtml = appStore.getRootComponent().getOuterHTML()
    expect(outerHtml.id).toEqual(appStore.getRootComponent().moduleId)
    expect(outerHtml.innerHTML).toBe('<div> test rendering layout </div>')

    appStore.undo()
    outerHtml = appStore.getRootComponent().getOuterHTML()
    expect(outerHtml.id).toEqual(appStore.getRootComponent().moduleId)
    expect(outerHtml.innerHTML).toBe('')

    appStore.redo()
    outerHtml = appStore.getRootComponent().getOuterHTML()
    expect(outerHtml.id).toEqual(appStore.getRootComponent().moduleId)
    expect(outerHtml.innerHTML).toBe('<div> test rendering layout </div>')

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})

class MockCSSStyleSheet{
  rules: Array<any> = []
  insertRule(rule){
    this.rules.push({selectorText:rule.split('{')[0], cssText:rule})
  }
}
(window as any)['CSSStyleSheet'] = MockCSSStyleSheet

test('set rendering style', () => {

    AppDebugEnvironment.getInstance().debugOn = false
    const appStore : AppStore = AppStore.getInstance(environment)

    appStore.setRenderingStyle(".test{background-color:'black'}")
    // .test is not used in the project => it has not been set
    let outerStyle = appStore.getRootComponent().getOuterCSS() as string
    expect(outerStyle.trim()).toBe("")

    const style = `#${appStore.rootComponentId}{ background-color: black }`
    appStore.setRenderingStyle(style)
    outerStyle = appStore.getRootComponent().getOuterCSS() as string
    expect(outerStyle.trim()).toEqual(style)

    appStore.undo()
    outerStyle = appStore.getRootComponent().getOuterCSS() as string
    expect(outerStyle.trim()).toBe("")
    appStore.redo()
    outerStyle = appStore.getRootComponent().getOuterCSS() as string
    expect(outerStyle.trim()).toEqual(style)

    appStore.updateProjectToIndexHistory(0, appStore.indexHistory)
})
