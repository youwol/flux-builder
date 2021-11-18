/** @format */

import { VirtualDOM } from '@youwol/flux-view'
import { AppStore } from '../../builder-editor/builder-state'
import { builderView } from '../../builder-editor/views/builder.view'
import { renderView } from '../../layout-editors/grapesjs-editor/views/render.view'
import { layoutEditorView } from '../../layout-editors/raw-editor'
import { rendersViewsNames, RenderViewName } from '../model'
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
    return {
        id: 'main-container',
        class: 'h-100 w-100 d-flex flex-column',
        children: [
            topBanner(appStore, presenterUiState),
            {
                class: 'flex-grow-1 d-flex flex-column',
                style: { minHeight: '0px' },
                children: rendersViewsNames
                    .filter((renderViewName) =>
                        presenterUiState.hasFeature(renderViewName),
                    )
                    .map((renderViewName) =>
                        viewsFactories[renderViewName](
                            appStore,
                            presenterUiState,
                        ),
                    ),
            },
            notificationsView(appStore),
        ],
    }
}

const viewsFactories: Record<
    RenderViewName,
    (appStore: AppStore, presenterUiState: PresenterUiState) => VirtualDOM
> = {
    'flow-builder': builderView,
    'grapejs-editor': renderView,
    'raw-editor': layoutEditorView,
    runner: runnerView,
}
