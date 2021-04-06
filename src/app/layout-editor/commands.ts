
import { Component } from '@youwol/flux-core';

import { LogLevel, AppDebugEnvironment, AppStore } from '../builder-editor/builder-state/index';
import { cleanCss, replaceTemplateElements, updateFluxCache, getAllComponentsRec,
     addComponentPlaceholder, privateClasses } from './utils';
import { setDynamicComponentsBlocks } from './editor';
import { buildCodePanel } from './code-editors';

export function plugCommands(editor: any, appStore: AppStore) {

    let debugSingleton = AppDebugEnvironment.getInstance()

    editor.on('change:changesCount', (e: any) => {

        if (appStore.project.runnerRendering.layout !== localStorage.getItem("gjs-html"))
            appStore.setRenderingLayout(localStorage.getItem("gjs-html"), false)

        let css = cleanCss(localStorage.getItem("gjs-css"))
        if (appStore.project.runnerRendering.style !== css)
            appStore.setRenderingStyle(css, false)
    });

    editor.on('canvas:drop', (dataTransfer: any, component: any) => {

        debugSingleton.debugOn &&
            debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "canvas:drop", object: { dataTransfer, component: component.toJSON() } })

        let child = component.view.el as HTMLDivElement
        // it happens that grapes add suffix e.g. ('-1', '-2', etc) on id...this is a patch to recover the module
        // it is happenning when multiple rendering div of the same module in the page
        let mdle = appStore.getModule(child.id) // || appStore.getModule( child.id.split("-").slice(0,-1).join('-') )

        if (mdle) {

            debugSingleton.debugOn &&
                debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "canvas:drop => flux-module", object: { module: mdle } })

            let childrenModulesId = []
            if (mdle instanceof Component.Module && !editor.fluxCache[mdle.moduleId]) {
                updateFluxCache(appStore, editor)
            }
            if (mdle instanceof Component.Module /*&& ! editor.fluxCache[mdle.moduleId] !=component*/) {
                // in a case of Component.Module we want to recover the last created gjs-component corresponding to the flux-component
                let parent = component.parent()
                let index = parent.components().indexOf(component)
                let cached = editor.fluxCache[mdle.moduleId]//.toHTML()
                debugSingleton.debugOn &&
                    debugSingleton.logRenderTopic({
                        level: LogLevel.Info, message: "canvas:drop => restore cached component",
                        object: { module: mdle, cachedComponent: cached, parent: parent.getEl() }
                    })

                component.remove()
                parent.append(cached.layout, { at: index })
                editor.getStyle().add(cached.styles)
                childrenModulesId = (mdle as Component.Module).getAllChildren().map(m => m.moduleId)
            }
            child.id = mdle.moduleId
            replaceTemplateElements([child.id, ...childrenModulesId], editor, appStore)
            setDynamicComponentsBlocks(appStore, editor)
        }
        updateFluxCache(appStore, editor)
    });

    editor.on('component:update:content', (a) => {
        //when inner html has changed, e.g. after text changed
        setTimeout(() => updateFluxCache(appStore, editor), 200)
    })

    editor.on('sorter:drag:end', ({ modelToDrop, srcEl }: { modelToDrop: any, srcEl: any }) => {
        debugSingleton.debugOn &&
            debugSingleton.logRenderTopic({ level: LogLevel.Info, message: "sorter:drag:end", object: { module: modelToDrop } })

        // a drop of any component is done => do nothing as the  canvas:drop wil handle the addition
        if (typeof (modelToDrop) == "string")
            return

        // from here: the drag end is a move => in case of flux-component the cache has the appropriate content 
        let mdle = appStore.getModule(modelToDrop.ccid)
        if (mdle && !(mdle instanceof Component.Module))
            replaceTemplateElements([mdle.moduleId], editor, appStore)

        if (mdle && mdle instanceof Component.Module) {

            let allGjsComponents = getAllComponentsRec(editor)

            if (mdle instanceof Component.Module)
                addComponentPlaceholder(appStore, editor, allGjsComponents, mdle)

            let allChildrenModulesId = mdle.getAllChildren().map(m => m.moduleId)
            replaceTemplateElements([mdle.moduleId].concat(allChildrenModulesId), editor, appStore)
        }
        updateFluxCache(appStore, editor)// if it happens that the div.id that is going to be created is a component => do not update the cache with it (at this stage it is empty)
    });

    editor.on('component:remove', (component) => {
        setDynamicComponentsBlocks(appStore, editor)
    });

    editor.on('selector:add', selector => {
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
            editor.Canvas.getDocument().getElementById("wrapper").classList.add("preview")
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
            editor.Canvas.getDocument().getElementById("wrapper").classList.remove("preview")

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
