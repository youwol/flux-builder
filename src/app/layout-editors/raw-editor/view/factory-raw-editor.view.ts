/** @format */

import { resizablePanel } from '@youwol/fv-group'
import { from } from 'rxjs'
import { share, tap } from 'rxjs/operators'
import { install } from '@youwol/cdn-client'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { AppStore } from '../../../builder-editor/builder-state'
import { PresenterUiState } from '../../../page'
import { factoryPresenter } from '../presenter'
import { logFactory } from '.'
import { codeMirrorView } from './code-mirror.view'
import { projectTreeView } from './project-tree.view'

const log = logFactory().getChildLogger('LayoutEditor')

export function factoryRawEditorView(
    appStore: AppStore,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    const cdn$ = fetchCDN$()
    const presenter = factoryPresenter(appStore)
    return {
        id: 'raw-editor_view',
        class: 'd-flex w-100',

        children: [
            resizablePanel(projectTreeView(presenter), 'Project Tree'),
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
        // Those two seems not required
        //'js-beautify#1.14.6~lang/css.min.js',
        //'js-beautify#1.14.6~lang/html.min.js',
    ]
    return from(
        install({ modules: ['codemirror', 'js-beautify'], scripts: urls }),
    ).pipe(
        tap(() => log.getChildLogger('PipingCdn').debug('piping fetchCDN')),
        share(),
    )
}
