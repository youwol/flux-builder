/** @format */

// Following import is to include style.css in the dist directory (using MiniCssExtractPlugin)
require('./style.css')

import { fetchBundles, fetchStyleSheets } from '@youwol/cdn-client'
import {
    includeYouWolLogoView,
    loadingErrorView,
    loadingLibView,
} from './loading.views'

// (index.html is handled by HtmlWebpackPlugin)
export {}

const loadingDiv = document.getElementById(
    'content-loading-screen',
) as HTMLDivElement
includeYouWolLogoView()

const stylesFutures = fetchStyleSheets([
    'bootstrap#4.4.1~bootstrap.min.css',
    'fontawesome#5.12.1~css/all.min.css',
    '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
    'grapes#0.17.26~css/grapes.min.css',
    'codemirror#5.52.0~codemirror.min.css',
    'codemirror#5.52.0~theme/blackboard.min.css',
])

const bundlesFutures = fetchBundles(
    {
        lodash: '4.17.15',
        grapes: '0.17.26',
        '@youwol/flux-core': 'latest',
        '@youwol/flux-svg-plots': 'latest',
        '@youwol/flux-view': 'latest',
        '@youwol/fv-group': 'latest',
        '@youwol/fv-button': 'latest',
        '@youwol/fv-tree': 'latest',
        '@youwol/fv-tabs': 'latest',
        '@youwol/fv-input': 'latest',
        '@youwol/fv-context-menu': 'latest',
        '@youwol/platform-essentials': 'latest',
        rxjs: '6.5.5',
    },
    window,
    (event) => {
        loadingLibView(event, loadingDiv)
    },
).catch((error) => {
    loadingErrorView(error, loadingDiv)
})

const [styles] = await Promise.all([stylesFutures, bundlesFutures])

const [linkBA, linfFA, linkYW, _] = styles
linkBA.id = 'bootstrap-css'
linkYW.id = 'youwol-css'
linfFA.id = 'fontawesome-css'

await import('./on-load')
