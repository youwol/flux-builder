/** @format */

/** @format */

import { Component, renderTemplate } from '@youwol/flux-core'
import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { AppStore } from '../../builder-editor/builder-state'
import { ViewState } from '../model'
import { PresenterUiState } from '../presenter'

export function runnerView(
    appStore: AppStore,
    presenter: PresenterUiState,
): VirtualDOM {
    return {
        id: 'final-render-view',
        class: attr$(
            presenter.getViewState('runner', 'd-flex').state$,
            (viewState: ViewState) => viewState.classes,
        ),

        children: [
            child$(appStore.appObservables.projectUpdated$, () => {
                return {
                    class: 'h-100 w-100 d-flex',
                    id: Component.rootComponentId,
                    connectedCallback: (contentDiv: HTMLDivElement) => {
                        const rootComponent =
                            appStore.project.workflow.modules.find(
                                (mdle) =>
                                    mdle.moduleId == Component.rootComponentId,
                            ) as Component.Module
                        const style = document.createElement('style')
                        style.textContent = rootComponent.getFullCSS(
                            appStore.project.workflow,
                            {
                                asString: true,
                            },
                        ) as string
                        document.head.append(style)
                        contentDiv.appendChild(rootComponent.getOuterHTML())
                        renderTemplate(contentDiv, [rootComponent])
                    },
                }
            }),
        ],
    }
}
