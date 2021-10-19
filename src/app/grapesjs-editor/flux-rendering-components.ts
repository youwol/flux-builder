import { Component, ModuleFlux, renderTemplate } from "@youwol/flux-core"
import { AppDebugEnvironment, AppStore, LogLevel } from "../builder-editor/builder-state"
import { getFluxBlockContent } from "./flux-blocks"
import { getAllComponentsRec } from "./utils"
import * as grapesjs from 'grapesjs'


export function removeTemplateElements(modules: Array<ModuleFlux>, editor) {

    let allGjs = getAllComponentsRec(editor)
    let modulesToRemove = modules
        .filter((m: ModuleFlux) => m.Factory.RenderView)

    let debugSingleton = AppDebugEnvironment.getInstance()
    debugSingleton.debugOn &&
        debugSingleton.logRenderTopic({
            level: LogLevel.Info,
            message: `removeTemplateElements`,
            object: { modules, modulesToRemove }
        })
        
    modulesToRemove
        .filter(mdle => allGjs[mdle.moduleId])
        .forEach(mdle => allGjs[mdle.moduleId].remove())
}


export function replaceTemplateElements(
    moduleIds: Array<string>, 
    editor: grapesjs.Editor, 
    appStore: AppStore): Array<ModuleFlux> {

    let debugSingleton = AppDebugEnvironment.getInstance()
    if(moduleIds.length==0)
        {return}

    debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
        level: LogLevel.Info,
        message: "replaceTemplateElements",
        object: { moduleIds, appStore }
    })
    let body = editor.Canvas.getDocument().body.querySelector('div')
    
    let mdles = moduleIds
        .map((mid) => appStore.getModule(mid))
        .filter(mdle => mdle.Factory.RenderView)

    renderTemplate(body, mdles.filter(mdle => !(mdle instanceof Component.Module)), {applyWrapperAttributes:false})
    mdles
        .filter(mdle => mdle instanceof Component.Module)
        .map(mdle => [mdle, editor.Canvas.getDocument().getElementById(mdle.moduleId)])
        .filter( ([_,renderedDiv]) => renderedDiv )
        .forEach(([mdle, renderedDiv]) => {
            mdle["renderedElementDisplayed$"].next(renderedDiv)
        })

    let allGjsComponents = getAllComponentsRec(editor)
    mdles
    .filter(mdle => allGjsComponents[mdle.moduleId] != undefined)
    .forEach(mdle => {
        // this one apply on the layout view the correct title when on element is selected
        allGjsComponents[mdle.moduleId].attributes["name"] = mdle.configuration.title
        // Two problems with grapesjs name when used in the layer manager: 
        // (i) they are stored in 'data-gjs-name' but this attribute is not persisted (we loose it at the next load).
        // Try in the layer manager to change the name of an element and reload ... not working
        // (ii) they are set at the flux-block definition (not updated when e.g. module's title is updated)
        // allGjsComponents[mdle.moduleId].name = mdle.configuration.title
        // allGjsComponents[mdle.moduleId].views[0].el.setAttribute("data-gjs-name",  mdle.configuration.title)
    })
    return mdles
}


export function updateElementsInLayout(
    diff: { removedElements: Array<ModuleFlux>, createdElements: Array<ModuleFlux> }, 
    editor: grapesjs.Editor, 
    appStore: AppStore) {

    let removedIds = diff.removedElements.map(m => m.moduleId)

    let toReplaceIds = diff.createdElements
        .filter((mdle: ModuleFlux) => mdle.Factory.RenderView)
        .filter((mdle: ModuleFlux) => removedIds.includes(mdle.moduleId))
        .map(mdle => mdle.moduleId)

    replaceTemplateElements(toReplaceIds, editor, appStore) 
}


/**
 * When a new module with rendering is dropped => it is inserted in the layout editor
 * if it belongs to the root component
 */
export function autoAddElementInLayout( 
    diff: { removedElements: Array<ModuleFlux>, createdElements: Array<ModuleFlux> },
    editor: grapesjs.Editor, 
    appStore: AppStore) {
    
    let allGjsComponents = getAllComponentsRec(editor)

    let removedIds = diff.removedElements.map(m => m.moduleId)

    let newIds = diff.createdElements
        .filter((mdle: ModuleFlux) => mdle.Factory.RenderView)
        .filter((mdle: ModuleFlux) => !removedIds.includes(mdle.moduleId))
        .filter((mdle: ModuleFlux) => appStore.getRootComponent().getModuleIds().includes(mdle.moduleId))
        .filter((mdle: ModuleFlux) => !(mdle instanceof Component.Module))
        .map((mdle: ModuleFlux) => {
            let htmlContent = getFluxBlockContent(mdle, editor, appStore.project.workflow)
            console.log(allGjsComponents[appStore.rootComponentId])
            allGjsComponents[appStore.rootComponentId].append(htmlContent, { at: 0 })
            return mdle.moduleId
        })
    replaceTemplateElements(newIds, editor, appStore)
}


/**
 * It can happen for instance when we group modules with view in a component => all included
 * modules will be removed from the view
 */
export function autoRemoveElementInLayout( 
    diff: { removedElements: Array<ModuleFlux>, createdElements: Array<ModuleFlux> }, 
    editor: any, 
    appStore: AppStore) {
    
    let removedIds = diff.removedElements.map(m => m.moduleId)

    let toRemove = diff.createdElements
        .filter((mdle: ModuleFlux) => mdle instanceof Component.Module)
        .filter((mdle: ModuleFlux) => !removedIds.includes(mdle.moduleId))
        .map( (mdle:Component.Module) => mdle.getDirectChildren(appStore.project.workflow))
        .flat()
    removeTemplateElements(toRemove, editor)
}
