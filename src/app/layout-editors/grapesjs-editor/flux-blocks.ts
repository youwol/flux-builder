/** @format */

import { Component, ModuleFlux, Workflow } from '@youwol/flux-core'
import {
    AppDebugEnvironment,
    AppStore,
    LogLevel,
} from '../../builder-editor/builder-state'
import { getAllComponentsRec } from './utils'
import * as grapesjs from 'grapesjs'

function scaleSvgIcons(g: any) {
    if (g.style.transform) {
        return
    }
    const parentBRect = g.parentElement.getBoundingClientRect()
    const bRect = g.getBoundingClientRect()
    const ty = parentBRect.top - bRect.top
    const tx = parentBRect.left - bRect.left
    const scale = Math.min(
        parentBRect.width / bRect.width,
        parentBRect.height / bRect.height,
    )
    g.style.transform = `translate(${parentBRect.width / 4}px,${
        parentBRect.height / 4
    }px) scale(${0.5 * scale}) translate(${tx}px,${ty}px)`
}

export function setDynamicComponentsBlocks(
    appStore: AppStore,
    editor: grapesjs.Editor,
) {
    const debugSingleton = AppDebugEnvironment.getInstance()
    const all = getAllComponentsRec(editor)

    const layerModuleIds = appStore.getActiveGroup().getModuleIds()
    const pluginIds = appStore.project.workflow.plugins
        .filter((plugin) =>
            layerModuleIds.includes(plugin.parentModule.moduleId),
        )
        .map((plugin) => plugin.moduleId)

    const modulesToRender = [...layerModuleIds, ...pluginIds]
        .filter((mid) => !all[mid])
        .map((mid) => appStore.getModule(mid))
        .filter((m) => m.Factory.RenderView)

    const componentBlocks = editor.BlockManager.getAll().filter(
        (block) => block.get('category').id == 'Components',
    )
    debugSingleton.debugOn &&
        debugSingleton.logRenderTopic({
            level: LogLevel.Info,
            message: 'set dynamic components block',
            object: { modulesToRender, componentBlocks },
        })
    componentBlocks.forEach((block) => editor.BlockManager.remove(block.id))
    modulesToRender.forEach((m) =>
        editor.BlockManager.add(
            m.moduleId,
            toDynamicBlock(m, editor, appStore.project.workflow),
        ),
    )
}

function toDynamicBlock(
    mdle: ModuleFlux,
    editor: grapesjs.Editor,
    workflow: Workflow,
) {
    return {
        id: mdle.moduleId,
        label: mdle.configuration.title,
        name: mdle.configuration.title,
        content: getFluxBlockContent(mdle, editor, workflow),
        activate: true,
        category: 'Components',
        render: ({ el }: { el: any }) => {
            const div = document.createElement('div')
            div.id = mdle.moduleId
            el.appendChild(div)
            const svg = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg',
            )
            svg.setAttribute('width', '100px')
            svg.setAttribute('height', '70px')
            const item = new mdle.Factory.BuilderView().icon()

            const g = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'g',
            )
            g.style.stroke = 'currentColor'
            g.classList.add('group-target')
            g.innerHTML = item.content
            svg.appendChild(g)
            div.appendChild(svg)
            document.body.appendChild(svg)
            scaleSvgIcons(g)
            svg.remove()
            div.appendChild(svg)
        },
    }
}

export function getFluxBlockContent(
    mdle: ModuleFlux,
    editor: grapesjs.Editor,
    workflow: Workflow,
) {
    const debugSingleton = AppDebugEnvironment.getInstance()
    debugSingleton.debugOn &&
        debugSingleton.logRenderTopic({
            level: LogLevel.Info,
            message: 'getDynamicBlockWrapperDiv',
            object: { mdle },
        })

    if (mdle instanceof Component.Module) {
        const html = mdle.getFullHTML(workflow)
        return html
            ? html.outerHTML
            : `<div id="${mdle.moduleId}" class="flux-element flux-component"  data-gjs-name="${mdle.configuration.title}"></div>`
    }
    const attr = mdle.Factory.RenderView.wrapperDivAttributes

    const classes =
        `flux-element` +
        (attr && attr(mdle).class ? ' ' + attr(mdle).class : '')

    const styles = attr && attr(mdle).style ? attr(mdle).style : {}
    const styleStr = Object.entries(styles).reduce(
        (acc, [k, v]) => acc + k + ':' + v + ';',
        '',
    )
    editor.getStyle().add(`#${mdle.moduleId}{${styleStr}}`)
    // we should be able to use a Component Definition: https://grapesjs.com/docs/api/block.html#block
    // I can't make it works
    console.log('getFluxBlockContent', mdle)
    return `<div id="${mdle.moduleId}" class="${classes}"  data-gjs-name="${mdle.configuration.title}"></div>`
}
