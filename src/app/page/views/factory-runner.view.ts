/** @format */

/** @format */

import { Component, renderTemplate } from '@youwol/flux-core'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { AppStore } from '../../builder-editor/builder-state'

export function factoryRunnerView(appStore: AppStore): VirtualDOM {
    return {
        id: 'runner_view',
        class: 'd-flex w-100',

        children: [
            child$(appStore.appObservables.projectUpdated$, () => {
                return {
                    class: 'h-100 w-100',
                    id: 'runner_view_content',
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
