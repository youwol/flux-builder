/** @format */

import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { from } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { AppStore } from '../../builder-editor/builder-state'
import { PresenterUiState, ViewState } from '../../page'
import { factoryPresenter } from '../presenter'
import { factoryCodeMirrorView } from './code-mirror.view'
import { factoryProjectTreeView } from './project-tree.view'

export function layoutEditorView(
    appStore: AppStore,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    const codeMirror$ = fetchCodeMirror$()
    const presenter = factoryPresenter(appStore)
    return {
        id: 'layout-editor-component',
        class: attr$(
            presenterUiState.getViewState('editor', 'd-flex').state$,
            (viewState: ViewState) => viewState.classes,
        ),

        children: [
            factoryProjectTreeView(presenter.presenterTree),
            child$(codeMirror$, () =>
                factoryCodeMirrorView('html', presenter.html, presenterUiState),
            ),
            child$(codeMirror$, () =>
                factoryCodeMirrorView('css', presenter.css, presenterUiState),
            ),
        ],
        disconnectedCallback: (_) => {
            presenter.unsubscribe()
        },
    }
}

function fetchCodeMirror$() {
    const cdn = window['@youwol/cdn-client']

    const urls = [
        'codemirror#5.52.0~mode/xml.min.js',
        'codemirror#5.52.0~mode/htmlmixed.min.js',
        'codemirror#5.52.0~mode/css.min.js',
    ]
    return from(
        cdn.fetchBundles({ codemirror: { version: '5.52.0' } }, window),
    ).pipe(
        mergeMap(() => {
            const promise = cdn.fetchJavascriptAddOn(urls, window)
            return from(promise)
        }),
    )
}
