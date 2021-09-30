
import { Component } from '@youwol/flux-core';

import { LogLevel, AppDebugEnvironment, AppStore } from '../builder-editor/builder-state/index';
import { cleanCss, privateClasses } from './utils';
import { buildCodePanel } from './code-editors';
import { setDynamicComponentsBlocks } from './flux-blocks';
import { replaceTemplateElements } from './flux-rendering-components';

export function plugCommands(editor: any, appStore: AppStore) {

    let debugSingleton = AppDebugEnvironment.getInstance()

    editor.on('change', (element: any) => {

        if (appStore.project.runnerRendering.layout !== localStorage.getItem("gjs-html")) {
            debugSingleton.debugOn &&
                debugSingleton.logRenderTopic({
                    level: LogLevel.Info, message: "change => layout",
                    object: {
                        element,
                        oldLayout: appStore.project.runnerRendering.layout,
                        newLayout: localStorage.getItem("gjs-html")
                    }
                })
            appStore.setRenderingLayout(localStorage.getItem("gjs-html"))
        }
        let css = cleanCss(localStorage.getItem("gjs-css"))
        if (appStore.project.runnerRendering.style !== css) {
            debugSingleton.debugOn &&
                debugSingleton.logRenderTopic({
                    level: LogLevel.Info, message: "change => style",
                    object: {
                        element,
                        oldCss: appStore.project.runnerRendering.style,
                        newCss: css
                    }
                })
            appStore.setRenderingStyle(css)
        }
    });

    editor.on('canvas:drop', (dataTransfer: any, component: any) => {

        debugSingleton.debugOn &&
            debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "canvas:drop", object: { dataTransfer, component: component.toJSON() } })

        let child = component.view.el as HTMLDivElement
        let mdle = appStore.getModule(child.id)

        if (mdle) {

            debugSingleton.debugOn &&
                debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "canvas:drop => flux-module", object: { module: mdle } })

            let childrenModulesId = []
            if (mdle instanceof Component.Module) {
                childrenModulesId = (mdle as Component.Module).getAllChildren().map(m => m.moduleId)
                editor.getStyle().add(mdle.getCSS({ recursive: true, asString:true }))
            }
            child.id = mdle.moduleId
            replaceTemplateElements([child.id, ...childrenModulesId], editor, appStore)
            setDynamicComponentsBlocks(appStore, editor)
        }
    });

    editor.on('component:update:content', (data) => {
        //when inner html has changed, e.g. after text changed
        debugSingleton.debugOn &&
            debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "component:update:content", object: { module: data } })
    })

    editor.on('component:update:style', (data) => {
        console.log("AAAAAAAAAAAAAAAAAAAAAA")
        debugSingleton.debugOn &&
            debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "component:update:style", object: { module: data } })
    })

    editor.on('sorter:drag:end', ({ modelToDrop, srcEl }: { modelToDrop: any, srcEl: any }) => {
        debugSingleton.debugOn &&
            debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "sorter:drag:end", object: { module: modelToDrop } })

        // a drop of any component is done => do nothing as the  canvas:drop wil handle the addition
        if (typeof (modelToDrop) == "string")
            return

        // from here: the drag end is a move => in case of flux-component the cache has the appropriate content 
        let mdle = appStore.getModule(modelToDrop.ccid)
        if(!mdle)
            return
            

        let moduleIds = (mdle instanceof Component.Module)
            ? mdle.getAllChildren().map(m => m.moduleId)
            : [mdle.moduleId]

        replaceTemplateElements(moduleIds, editor, appStore)
    });

    editor.on('component:remove', (component) => {
        if (appStore.getActiveLayer().getModuleIds().includes(component.ccid))
            setDynamicComponentsBlocks(appStore, editor)
    });

    editor.on('selector:add', selector => {
        selector.set('active', false )
        selector.set('private', privateClasses.includes(selector.id)) 
    });

    editor.Commands.add('show-blocks', {
        getRowEl(editor: any) { return editor.getContainer().closest('#editor-row'); },
        getLayersEl(row: any) { return row.querySelector('#blocks') },

        run(editor: any, sender: any) {
            const lmEl = this.getLayersEl(this.getRowEl(editor));
            lmEl.style.display = '';
        },
        stop(editor: any, sender: any) {
            const lmEl = this.getLayersEl(this.getRowEl(editor));
            lmEl.style.display = 'none';
        },
    });
    editor.Commands.add('show-styles', {

        getRowEl(editor: any) { return editor.getContainer().closest('#editor-row'); },
        getStyleEl(row: any) { return row.querySelector('#styles') },

        run(editor: any, sender: any) {
            const smEl = this.getStyleEl(this.getRowEl(editor));
            smEl.style.display = '';
        },
        stop(editor: any, sender: any) {
            const smEl = this.getStyleEl(this.getRowEl(editor));
            smEl.style.display = 'none';
        },
    });;
    editor.Commands.add('show-layers', {

        getRowEl(editor: any) { return editor.getContainer().closest('#editor-row'); },
        getLayersEl(row: any) { return row.querySelector('#layers') },

        run(editor: any, sender: any) {
            const smEl = this.getLayersEl(this.getRowEl(editor));
            smEl.style.display = '';
        },
        stop(editor: any, sender: any) {
            const smEl = this.getLayersEl(this.getRowEl(editor));
            smEl.style.display = 'none';
        },
    });
    editor.Commands.add('show-traits', {

        getRowEl(editor: any) { return editor.getContainer().closest('#editor-row'); },
        getTraitsEl(row: any) { return row.querySelector('#traits') },

        run(editor: any, sender: any) {
            const smEl = this.getTraitsEl(this.getRowEl(editor));
            smEl.style.display = '';
        },
        stop(editor: any, sender: any) {
            const smEl = this.getTraitsEl(this.getRowEl(editor));
            smEl.style.display = 'none';
        },
    });
    editor.Commands.add('open-code', {

        getRowEl(editor: any) { return editor.getContainer().closest('#editor-row'); },
        getCodeEl(row: any) { return row.querySelector('#codes') },

        run: function (editor, senderBtn) {
            const pn = editor.Panels;
            const id = 'code';
            const panel = pn.getPanel(id) || pn.addPanel({ id });
            let divi = this.getCodeEl(this.getRowEl(editor));
            console.log("Code elements", divi)
            if (!this.codePanel) this.codePanel = buildCodePanel(appStore, editor, panel)
            console.log("Code Panel", this.codePanel)
            this.codePanel.style.display = 'block';
            divi.appendChild(this.codePanel)
            //editor.$('#panel__right_render').get(0).style.width = '35%';
            //editor.$('.gjs-cv-canvas').get(0).style.width = '65%';
        },
        stop: function (editor, senderBtn) {
            if (this.codePanel) this.codePanel.style.display = 'none';
            //editor.$('#panel__right_render').get(0).style.width = '15%';
            //editor.$('.gjs-cv-canvas').get(0).style.width = '85%';
        },
    })
    editor.Commands.add("custom-preview", {
        run(editor: any, sender: any) {

            document.querySelector("#gjs-cv-tools").classList.add("preview")
            let body = editor.Canvas.getDocument().body.querySelector('div')
            body.classList.add("preview")
            // we hide template elements
            Array.from(editor.Canvas.getDocument().querySelectorAll(".flux-builder-only"))
                .forEach((element: any) => element.classList.add('preview')
                );

            let panelsContainer = document.getElementById("panels-container-render")
            panelsContainer.classList.add("collapsed")
            let panel = document.getElementById("panel__right_render")
            panel.classList.add("collapsed")
            panel.querySelectorAll(".flex-align-switch").forEach((e: HTMLElement) => e.style.flexDirection = "column")

            editor.$('#panel__right_render').get(0).style.width = '50px';
            panel.querySelectorAll(".buttons-toolbox").forEach((e: HTMLDivElement) => {
                let div = e.firstChild as HTMLElement
                if (div && div.style)
                    div.style.flexDirection = "column"
            })
        },
        stop(editor: any, sender: any) {

            document.querySelector("#gjs-cv-tools").classList.remove("preview")
            let body = editor.Canvas.getDocument().body.querySelector('div')
            body.classList.remove("preview")

            Array.from(editor.Canvas.getDocument().querySelectorAll(".flux-builder-only"))
                .forEach((element: any) => element.classList.remove('preview')
                );

            let panelsContainer = document.getElementById("panels-container-render")
            panelsContainer.classList.remove("collapsed")
            let panel = document.getElementById("panel__right_render")
            panel.classList.remove("collapsed")
            panel.querySelectorAll(".flex-align-switch").forEach((e: HTMLElement) => e.style.flexDirection = "row")

            //editor.$('#panel__right_render').get(0).style.width = '15%';
            panel.querySelectorAll(".buttons-toolbox").forEach((e: HTMLDivElement) => {
                let div = e.firstChild as HTMLElement
                if (div && div.style)
                    div.style.flexDirection = "row"
            })
        }
    })
    editor.Commands.add('set-device-tablet', {
        run(editor: any, sender: any) {
            editor.setDevice('Tablet')
        },
        stop(editor: any, sender: any) { },
    });
    editor.Commands.add('set-device-desktop', {
        run(editor: any, sender: any) {
            editor.setDevice('Desktop')
        },
        stop(editor: any, sender: any) { },
    });
    editor.Commands.add('set-device-mobile-landscape', {
        run(editor: any, sender: any) {
            editor.setDevice('Mobile landscape')
        },
        stop(editor: any, sender: any) { },
    });
    editor.Commands.add('set-device-mobile-portrait', {
        run(editor: any, sender: any) {
            editor.setDevice('Mobile portrait')
        },
        stop(editor: any, sender: any) { },
    });
    editor.on('run:preview:before', ({ sender }: { sender: any }) => {
        sender.panelRight = document.getElementById("panel__right")
        sender.panelRight.remove()
    });
    editor.on('stop:preview:before', ({ sender }: { sender: any }) => {
        if (sender && sender.panelRight) {
            document.getElementById("editor-row").appendChild(sender.panelRight)
        }
    });
}
