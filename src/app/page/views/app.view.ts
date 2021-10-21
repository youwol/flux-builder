/** @format */

import { attr$, VirtualDOM } from '@youwol/flux-view'
import { ReplaySubject } from 'rxjs'
import { AppStore } from '../../builder-editor/builder-state'
import { builderView } from '../../builder-editor/views/builder.view'
import { renderView } from '../../grapesjs-editor/views/render.view'
import { layoutEditorView } from '../../layout-editor/view/'
import { ViewState } from '../model'
import { PresenterUiState } from '../presenter'
import { runnerView } from './runnerView'
import { topBanner } from './top-banner.view'

function notificationsView(_appStore: AppStore): VirtualDOM {
    return {
        id: 'notifications-container',
    }
}

export function mainView(
    appStore: AppStore,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    const test$ = new ReplaySubject(1)
    test$.next('test')
    return {
        id: 'main-container',
        class: 'h-100 w-100 d-flex flex-column',
        children: [
            topBanner(appStore, presenterUiState),
            {
                // Dirty hack : grapejs is display: block and not display: flex,
                // so its parents cannot be flex-column when its siblings are display: none
                class: attr$(
                    presenterUiState.getViewState('grapejs').state$,
                    (viewState: ViewState) =>
                        viewState.display === 'mono'
                            ? 'flex-grow-1'
                            : 'd-flex flex-column',
                ),
                style: { minHeight: '0px' },
                children: [
                    builderView(appStore, presenterUiState),
                    renderView(appStore, presenterUiState),
                    layoutEditorView(appStore, presenterUiState),
                    runnerView(appStore, presenterUiState),
                ],
            },
            notificationsView(appStore),
        ],
    }
}
