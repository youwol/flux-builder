/** @format */

// Following import is to include style.css in the dist directory (using MiniCssExtractPlugin)
require('./style.css')

import { Client, install, LoadingScreenView } from '@youwol/cdn-client'

export {}

const loadingScreen = new LoadingScreenView({
    container: document.body,
})
loadingScreen.render()

await install({
    modules: [
        'lodash#4.x',
        'grapes#0.x',
        '@youwol/flux-core#0.x',
        '@youwol/flux-svg-plots#0.x',
        '@youwol/fv-group#0.x',
        '@youwol/fv-button#0.x',
        '@youwol/fv-tree#0.x',
        '@youwol/fv-tabs#0.x',
        '@youwol/fv-input#0.x',
        '@youwol/fv-context-menu#0.x',
        '@youwol/os-top-banner#0.x',
    ],
    css: [
        {
            location: 'bootstrap#4.4.1~bootstrap.min.css',
            sideEffects: ({ htmlLinkElement }) => {
                htmlLinkElement.id = 'bootstrap-css'
            },
        },
        {
            location: 'fontawesome#5.12.1~css/all.min.css',
            sideEffects: ({ htmlLinkElement }) => {
                htmlLinkElement.id = 'fontawesome-css'
            },
        },
        {
            location:
                '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            sideEffects: ({ htmlLinkElement }) => {
                htmlLinkElement.id = 'youwol-css'
            },
        },
        '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
        'grapes#latest~css/grapes.min.css',
        'codemirror#5.52.0~codemirror.min.css',
        'codemirror#5.52.0~theme/blackboard.min.css',
    ],
    onEvent: (ev) => loadingScreen.next(ev),
})

Client['initialLoadingScreen'] = loadingScreen

await import('./on-load')
