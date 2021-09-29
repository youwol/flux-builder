import { Component, ModuleFlux } from "@youwol/flux-core"
import { AppDebugEnvironment, AppStore, LogLevel } from "../builder-editor/builder-state"
import { getAllComponentsRec } from "./utils"
import * as grapesjs from 'grapesjs'


function scaleSvgIcons(g: any) {
    if (g.style.transform)
        return
    let parentBRect = g.parentElement.getBoundingClientRect()
    let bRect = g.getBoundingClientRect()
    let ty = parentBRect.top - bRect.top
    let tx = parentBRect.left - bRect.left
    let scale = Math.min(parentBRect.width / bRect.width, parentBRect.height / bRect.height)
    g.style.transform = `translate(${parentBRect.width / 4}px,${parentBRect.height / 4}px) scale(${0.5 * scale}) translate(${tx}px,${ty}px)`;
}

export function setDynamicComponentsBlocks(appStore: AppStore, editor: grapesjs.Editor) {

    let debugSingleton = AppDebugEnvironment.getInstance()
    let all = getAllComponentsRec(editor)

    let layerModuleIds = appStore.getActiveLayer().getModuleIds()
    let pluginIds = appStore.project.workflow.plugins
        .filter(plugin => layerModuleIds.includes(plugin.parentModule.moduleId))
        .map(plugin => plugin.moduleId)

    let modulesToRender = [...layerModuleIds, ...pluginIds]
        .filter(mid => !all[mid])
        .map(mid => appStore.getModule(mid)).filter(m => m.Factory.RenderView)

    let componentBlocks = editor.BlockManager.getAll().filter(block => block.get('category').id == "Components")
    debugSingleton.debugOn &&
        debugSingleton.logRenderTopic({
            level: LogLevel.Info,
            message: "set dynamic components block",
            object: { modulesToRender, componentBlocks }
        })
    componentBlocks.forEach(block => editor.BlockManager.remove(block.id))
    modulesToRender.forEach(m => editor.BlockManager.add(m.moduleId, toDynamicBlock(m, editor)))
}

function toDynamicBlock(mdle: ModuleFlux, editor) {

    return {
        id: mdle.moduleId,
        label: mdle.configuration.title,
        name: mdle.configuration.title,
        content: getFluxBlockContent(mdle, editor),
        activate: true,
        category: "Components",
        render: ({ el }: { el: any }) => {
            let div = document.createElement("div")
            div.id = mdle.moduleId
            el.appendChild(div)
            let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "100px");
            svg.setAttribute("height", "70px");
            let item = new mdle.Factory.BuilderView().icon()

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
            g.style.stroke = "currentColor"
            g.classList.add("group-target")
            g.innerHTML = item.content
            svg.appendChild(g)
            div.appendChild(svg)
            document.body.appendChild(svg)
            scaleSvgIcons(g)
            svg.remove()
            div.appendChild(svg)
        }
    }
}

export function getFluxBlockContent(mdle: ModuleFlux, editor) {

    let debugSingleton = AppDebugEnvironment.getInstance()
    debugSingleton.debugOn &&
        debugSingleton.logRenderTopic({
            level: LogLevel.Info,
            message: "getDynamicBlockWrapperDiv",
            object: { mdle }
        })

    if (mdle instanceof Component.Module) {
        let html = mdle.getHTML({ recursive: true })
        return html 
            ? html.outerHTML 
            : `<div id="${mdle.moduleId}" class="flux-element flux-component"  data-gjs-name="${mdle.configuration.title}"></div>`
    }
    let attr = mdle.Factory.RenderView.wrapperDivAttributes

    let classes = `flux-element` +
        (attr && attr(mdle).class ? " " + attr(mdle).class : "")

    let styles = attr && attr(mdle).style ? attr(mdle).style : {}
    let styleStr = Object.entries(styles).reduce((acc, [k, v]) => acc + k + ":" + v + ";", "")
    editor.getStyle().add(`#${mdle.moduleId}{${styleStr}}`)
    // we should be able to use a Component Definition: https://grapesjs.com/docs/api/block.html#block
    // I can't make it works
    console.log("getFluxBlockContent", mdle)
    return `<div id="${mdle.moduleId}" class="${classes}"  data-gjs-name="${mdle.configuration.title}"></div>`

}

