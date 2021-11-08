import {AppDebugEnvironment, AppStore, LogLevel} from '../builder-editor/builder-state/index'

import {getRenderPanels} from './panels'

import {getBlocks} from './blocks'
import {getStylesSectors} from './style-manager'
import {plugCommands} from './commands'
import {applyPatches} from './patches'
import {Subject} from 'rxjs'
import {take} from 'rxjs/operators'

import * as grapesjs from 'grapesjs'


export async function createLayoutEditor(): grapesjs.Editor {
    localStorage.setItem("gjs-components", "")
    localStorage.setItem("gjs-html", "")
    localStorage.setItem("gjs-css", "")
    localStorage.setItem("gjs-styles", "")

    const debugSingleton = AppDebugEnvironment.getInstance()
    debugSingleton.debugOn &&
        debugSingleton.logRenderTopic({
            level: LogLevel.Info,
            message: "create layout editor",
            object: {}
        })

    const editor$ = new Subject<any>()

    const editor = grapesjs.init({
        autorender: false,
        container: '#gjs',
        canvas: {
            styles: [],
            scripts: []
        },
        height: '100%',
        width: 'auto',
        panels: { defaults: [] },
        assetManager: {
            assets: [],
            autoAdd: 1
        },
        keymaps: {
            defaults: {}
        },
        commands: {
            defaults: []
        },
        selectorManager: {
            appendTo: '#styles'
        },
        blockManager: {
            appendTo: '#blocks',
            blocks: getBlocks()
        },
        styleManager: {
            appendTo: '#styles',
            sectors: getStylesSectors()
        },
        layerManager: { appendTo: '#layers', },
        traitManager: { appendTo: '#traits', },
    });

    editor.dynamicModulesId = []
    editor.fluxCache = {}

    const bootstrapCss = document.getElementById("bootstrap-css")
    if (!bootstrapCss)
        {console.error("Bootstrap css needs to be included in host application with id 'bootstrap-css' ")}
    const fontawesomeCss = document.getElementById("fontawesome-css")
    if (!fontawesomeCss)
        {console.error("Fontawesome css needs to be included in host application with id 'fontawesome-css' ")}
    const youwolCss = document.getElementById("youwol-css")
    if (!youwolCss)
        {console.error("Fontawesome css needs to be included in host application with id 'fontawesome-css' ")}

    editor.on('load', function () {
        const document = editor.Canvas.getDocument() as HTMLDocument
        const headElement = document.head as HTMLHeadElement
        headElement.appendChild(bootstrapCss.cloneNode())
        headElement.appendChild(fontawesomeCss.cloneNode())
        headElement.appendChild(youwolCss.cloneNode())

        const node = document.createElement('style');
        node.innerHTML = `.mw-50px{ min-width:50px}.w-5{width:5%};.w-10{width:10%}.w-15{width:15%}.w-20{width:20%}.w-30{width:30%}.w-40{width:40%}.w-60{width:60%}.w-70{width:70%}.w-80{width:80%}.w-90{width:90%}.zindex-1{z-index:1}
    .flux-component{min-height:50px;} .preview .gjs-hovered{outline:0px !important} .preview .gjs-selected{outline:0px !important} 
    .flux-builder-only{opacity:0.5} .flux-builder-only.preview{ display:none !important}
    .flux-fill-parent{width:100%; height:100%}`;
        document.body.appendChild(node);
        editor$.next(editor)

    })
    editor.SelectorManager.getAll().each(selector => {
        console.log("Set privates class!!")
        //selector.set('private', privateClasses.includes(selector.id))
        selector.set('private', true)
    });
    editor.render();
    return new Promise((successCb) => editor$.pipe(take(1)).subscribe((edtr) => successCb(edtr)))
}


export function initLayoutEditor(
    editor: grapesjs.Editor,
    {layout, style} : {layout: HTMLDivElement, style: string},
    appStore: AppStore
) {

    const debugSingleton = AppDebugEnvironment.getInstance()

    debugSingleton.debugOn &&
        debugSingleton.logRenderTopic({
            level: LogLevel.Info,
            message: "initialize layout editor",
            object: {}
        })

    plugCommands(editor, appStore)
    editor.BlockManager.getCategories().each((ctg: any) => ctg.set('open', false))

    getRenderPanels().forEach(p => editor.Panels.addPanel(p))

    applyPatches(editor)

    console.log("INIT!!", {layout:layout.outerHTML, style})
    editor.setComponents(layout.outerHTML)

    editor.setStyle(style);
}
