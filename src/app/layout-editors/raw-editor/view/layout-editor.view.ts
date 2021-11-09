/** @format */

import { install } from '@youwol/cdn-client'
import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { from } from 'rxjs'
import { share, tap } from 'rxjs/operators'
import { AppStore } from '../../../builder-editor/builder-state'
import { PresenterUiState, ViewState } from '../../../page'
import { factoryPresenter } from '../presenter'
import { codeMirrorView } from './code-mirror.view'
import { logFactory } from './index'
import { projectTreeView } from './project-tree.view'

const log = logFactory().getChildLogger('LayoutEditor')

export function layoutEditorView(
    appStore: AppStore,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    const cdn$ = fetchCDN$()
    const presenter = factoryPresenter(appStore)
    return {
        id: 'layout-editor-component',
        class: attr$(
            presenterUiState.getPresenterViewState('raw-layout-editor', 'd-flex').state$,
            (viewState: ViewState) => viewState.classes,
        ),

        children: [
            projectTreeView(presenter.presenterTree),
            {
                class: 'h-100 d-flex flex-grow-1',
                children: [
                    child$(cdn$, () =>
                        codeMirrorView(
                            'html',
                            presenter.html,
                            presenterUiState,
                        ),
                    ),
                    child$(cdn$, () =>
                        codeMirrorView('css', presenter.css, presenterUiState),
                    ),
                ],
            },
        ],
        disconnectedCallback: (_) => {
            presenter.unsubscribe()
        },
    }
}

function fetchCDN$() {
    const urls = [
        'codemirror#5.52.0~mode/xml.min.js',
        'codemirror#5.52.0~mode/htmlmixed.min.js',
        'codemirror#5.52.0~mode/css.min.js',
        'js-beautify#1.14.0~lang/css.min.js',
        'js-beautify#1.14.0~lang/html.min.js',
    ]
    return from(
        install(
            { modules: ['codemirror', 'js-beautify'], scripts: urls },
            window,
        ),
    ).pipe(
        tap(() => log.getChildLogger('PipingCdn').debug('')),
        share(),
    )
}
