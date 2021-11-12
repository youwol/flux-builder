/** @format */

import { VirtualDOM } from '@youwol/flux-view'
import { AppStore } from '../../builder-editor/builder-state'
import { builderView } from '../../builder-editor/views/builder.view'
import { renderView } from '../../layout-editors/grapesjs-editor/views/render.view'
import { layoutEditorView } from '../../layout-editors/raw-editor'
import { PresenterUiState } from '../presenter'
import { runnerView } from './runnerView'
import { topBanner } from './top-banner.view'

function notificationsView(_appStore: AppStore): VirtualDOM {
    return {
        id: 'notifications-container',
    }
}

function getRendersViews(
    appStore: AppStore,
    presenterUiState: PresenterUiState,
) {
    if (presenterUiState.features === 'main') {
        return [
            builderView(appStore, presenterUiState),
            renderView(appStore, presenterUiState),
        ]
    } else {
        return [
            builderView(appStore, presenterUiState),
            layoutEditorView(appStore, presenterUiState),
            runnerView(appStore, presenterUiState),
        ]
    }
}

export function mainView(
    appStore: AppStore,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    return {
        id: 'main-container',
        class: 'h-100 w-100 d-flex flex-column',
        children: [
            topBanner(appStore, presenterUiState),
            {
                class: 'flex-grow-1 d-flex flex-column',
                style: { minHeight: '0px' },
                children: getRendersViews(appStore, presenterUiState),
            },
            notificationsView(appStore),
        ],
    }
}
