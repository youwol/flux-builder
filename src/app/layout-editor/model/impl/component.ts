/** @format */

import { Component, ModuleConfiguration, ModuleFlux } from '@youwol/flux-core'
import { ContractModelComponent, logFactory } from '../'
import { AppStore } from '../../../builder-editor/builder-state'
import { v } from '../../../externals_evolutions/logging'
import { ModelModule } from './module'

export const hasRenderView = (mdle: ModuleFlux): boolean =>
    mdle.Factory.RenderView !== undefined

const log = logFactory().getChildLogger('Component')

export class ModelComponent
    extends ModelModule
    implements ContractModelComponent
{
    private readonly _log

    constructor(
        private readonly component: Component.Module,
        appStore: AppStore,
    ) {
        super(component, appStore, true)
        this._log = log.getChildLogger(`[${component.moduleId}]`)
        this._log.debug('Constructor')
    }

    public set contentHtml(content: string) {
        this._log.debug('set HTML content to {0}', v(content))
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
        this._log.debug('get HTML content {0}', v(content))
        return content
    }

    public set contentCss(content: string) {
        this._log.debug('set CSS content to {0}', v(content))
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
        this._log.debug('get CSS content {0}', v(content))
        return content
    }
}
