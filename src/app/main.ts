/** @format */

// Following import is to include style.css in the dist directory (using MiniCssExtractPlugin)
require('./style.css')

import { Client, install, LoadingScreenView } from '@youwol/cdn-client'

export {}

const loadingScreen = new LoadingScreenView({
    container: document.body,
    mode: 'svg',
})
loadingScreen.render()

await install(
    {
        modules: [
            'lodash',
            'grapes',
            '@youwol/flux-core',
            '@youwol/flux-svg-plots',
            '@youwol/flux-view',
            '@youwol/fv-group',
            '@youwol/fv-button',
            '@youwol/fv-tree',
            '@youwol/fv-tabs',
            '@youwol/fv-input',
            '@youwol/fv-context-menu',
            '@youwol/platform-essentials',
            'rxjs',
        ],
        css: [
            {
                resource: 'bootstrap#4.4.1~bootstrap.min.css',
                domId: 'bootstrap-css',
            },
            {
                resource: 'fontawesome#5.12.1~css/all.min.css',
                domId: 'fontawesome-css',
            },
            {
                resource:
                    '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
                domId: 'youwol-css',
            },
            {
                resource: 'grapes#0.17.26~css/grapes.min.css',
                domId: 'grapes-css',
            },
            {
                resource: 'codemirror#5.52.0~codemirror.min.css',
                domId: 'codemirror-css',
            },
            {
                resource: 'codemirror#5.52.0~theme/blackboard.min.css',
                domId: 'codemirror-blackboard-css',
            },
        ],
    },
    {
        onEvent: (ev) => loadingScreen.next(ev),
    },
)
Client['initialLoadingScreen'] = loadingScreen

await import('./on-load')
