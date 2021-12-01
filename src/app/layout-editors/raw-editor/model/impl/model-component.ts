/** @format */

import { Component, ModuleConfiguration } from '@youwol/flux-core'
import { Logger } from '@youwol/logging'
import { AppStore } from '../../../../builder-editor/builder-state'
import { logFactory, ModelComponent } from '..'
import { ImplModelModule } from './model-module'

const log = logFactory().getChildLogger('Component')

export class ImplModelComponent
    extends ImplModelModule
    implements ModelComponent
{
    private readonly ownLog: Logger

    constructor(
        private readonly component: Component.Module,
        appStore: AppStore,
    ) {
        super(component, appStore, true)
        this.ownLog = log.getChildLogger(`[${component.moduleId}]`)
        this.ownLog.debug('Constructor')
    }

    public set contentHtml(content: string) {
        this.ownLog.debug('set HTML content', {
            value: content,
            dump: true,
        })
        const htmlDivElement = this.component.getOuterHTML()
            ? this.component.getOuterHTML()
            : document.createElement('div')
        htmlDivElement.innerHTML = content

        this.appStore.updateModule(
            this.component,
            new ModuleConfiguration({
                ...this.component.configuration,
                ...{
                    data: new Component.PersistentData({
                        ...this.component.getPersistentData<Component.PersistentData>(),
                        html: htmlDivElement.outerHTML,
                    }),
                },
            }),
        )
    }

    public get contentHtml(): string {
        const content = this.component.getOuterHTML()?.innerHTML ?? ''
        this.ownLog.debug('get HTML content', {
            value: content,
            dump: true,
        })
        return content
    }

    public set contentCss(content: string) {
        this.ownLog.debug('set CSS content', {
            value: content,
            dump: true,
        })
        this.appStore.updateModule(
            this.component,
            new ModuleConfiguration({
                ...this.component.configuration,
                ...{
                    data: new Component.PersistentData({
                        ...this.component.getPersistentData<Component.PersistentData>(),
                        ...{
                            css: content,
                        },
                    }),
                },
            }),
        )
    }

    public get contentCss(): string {
        const content = this.component.getOuterCSS()?.toString() ?? ''
        this.ownLog.debug('get CSS content', {
            value: content,
            dump: true,
        })
        return content
    }
}
