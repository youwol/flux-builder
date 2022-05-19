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
