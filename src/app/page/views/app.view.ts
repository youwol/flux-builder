/** @format */

import { install } from '@youwol/cdn-client'
import { VirtualDOM } from '@youwol/flux-view'
import {
    YouwolBannerView,
    defaultUserMenu,
    defaultYouWolMenu,
    YouwolBannerState,
} from '@youwol/flux-youwol-essentials'
import { from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
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
    const youwolBannerState = new YouwolBannerState({
        cmEditorModule$: fetchCodeMirror$(),
    })
    return {
        id: 'main-container',
        class: 'h-100 w-100 d-flex flex-column',
        children: [
            new TopBannerView(appStore, presenterUiState, youwolBannerState),
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

class TopBannerView extends YouwolBannerView {
    public readonly class = 'd-flex flex-grow-l grapes-bg-color p-1'

    constructor(
        appStore: AppStore,
        presenter: PresenterUiState,
        youwolBannerState: YouwolBannerState,
    ) {
        super({
            state: youwolBannerState,
            customActionsView: topBanner(appStore, presenter),
            userMenuView: defaultUserMenu(youwolBannerState),
            youwolMenuView: defaultYouWolMenu(youwolBannerState),
            signedIn$: from(
                fetch(new Request('/api/assets-gateway/healthz')),
            ).pipe(map((resp) => resp.status == 200)),
        })
    }
}

function fetchCodeMirror$(): Observable<Window> {
    return from(
        install({
            modules: ['codemirror'],
            scripts: ['codemirror#5.52.0~mode/javascript.min.js'],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
            ],
        }),
    )
}
