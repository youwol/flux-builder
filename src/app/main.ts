/** @format */

// Following import is to include style.css in the dist directory (using MiniCssExtractPlugin)
require('./style.css')

import { Client, install, LoadingScreenView } from '@youwol/cdn-client'

export {}

const loadingScreen = new LoadingScreenView({
    container: document.body,
})
loadingScreen.render()

await install(
    {
        modules: [
            { name: 'lodash', version: '4.x' },
            { name: 'grapes', version: '0.x' },
            { name: '@youwol/flux-core', version: '0.x' },
            { name: '@youwol/flux-svg-plots', version: '0.x' },
            { name: '@youwol/fv-group', version: '0.x' },
            { name: '@youwol/fv-button', version: '0.x' },
            { name: '@youwol/fv-tree', version: '0.x' },
            { name: '@youwol/fv-tabs', version: '0.x' },
            { name: '@youwol/fv-input', version: '0.x' },
            { name: '@youwol/fv-context-menu', version: '0.x' },
            { name: '@youwol/os-top-banner', version: '0.x' },
        ],
        css: [
            {
                resource: 'bootstrap#4.4.1~bootstrap.min.css',
            },
            {
                resource: 'fontawesome#5.12.1~css/all.min.css',
            },
            {
                resource:
                    '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            },
            {
                resource: 'grapes#latest~css/grapes.min.css',
            },
            {
                resource: 'codemirror#5.52.0~codemirror.min.css',
            },
            {
                resource: 'codemirror#5.52.0~theme/blackboard.min.css',
            },
        ],
    },
    {
        onEvent: (ev) => loadingScreen.next(ev),
    },
)
const links = document.querySelectorAll('head link')

;[...links].find((l) => l.getAttribute('href').includes(btoa('bootstrap'))).id =
    'bootstrap-css'
;[...links].find((l) =>
    l.getAttribute('href').includes(btoa('fontawesome')),
).id = 'fontawesome-css'
;[...links].find((l) =>
    l.getAttribute('href').includes(btoa('@youwol/fv-widgets')),
).id = 'youwol-css'
Client['initialLoadingScreen'] = loadingScreen

await import('./on-load')
