/** @format */

import { VirtualDOM } from '@youwol/flux-view'
import { TopBannerView } from '@youwol/os-top-banner'
import { AppStore } from '../../builder-editor/builder-state'
import { PresenterUiState } from '../presenter'
import { panelView } from './panel.view'
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
            new FluxTopBanner(appStore, presenterUiState),
            {
                id: 'main-panels',
                class: 'flex-grow-1 d-flex flex-column',
                style: { minHeight: '0px' },
                children: presenterUiState.availableRendersViews.map(
                    (renderViewName) =>
                        panelView(renderViewName, appStore, presenterUiState),
                ),
            },
            notificationsView(appStore),
        ],
    }
}

class FluxTopBanner extends TopBannerView {
    constructor(appStore: AppStore, presenter: PresenterUiState) {
        super({
            innerView: topBanner(appStore, presenter),
        } as never)
    }
}
