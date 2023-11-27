/** @format */

// Following import is to include style.css in the dist directory (using MiniCssExtractPlugin)
require('./style.css')

import { setup } from '../auto-generated'
import { Client, LoadingScreenView, State } from '@youwol/cdn-client'
import * as cdnClient from '@youwol/cdn-client'
export {}

/**
 * Those next patches & dependencies are required if the project loaded is old and refers old resources
 * that are moved to better place
 */
const urlPatches = {
    'three.min.js': 'dist/three.js',
    'three-trackballcontrols.min.js': 'dist/three-trackballcontrols.js',
}

function patchUrl(url, name) {
    const patched = url.replace(name, urlPatches[name])
    console.warn(`The url ${url} requires a patch: ${patched}`)
    return patched
}
State.registerUrlPatcher(({ url }: { url: string }) => {
    const match = Object.keys(urlPatches).find((name) => url.includes(name))
    return match ? patchUrl(url, match) : url
})

/**
 * Done backward compatibility patching
 */

const loadingScreen = new LoadingScreenView({
    container: document.body,
})
loadingScreen.render()
await setup.installMainModule({
    cdnClient,
    installParameters: {
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
            'grapesjs#0.18.3~css/grapes.min.css',
            'codemirror#5.52.0~codemirror.min.css',
            'codemirror#5.52.0~theme/blackboard.min.css',
        ],
        onEvent: (ev) => loadingScreen.next(ev),
    },
})
/*
await install({
    modules: Object.entries(setup.runTimeDependencies.load)
        .filter(
            ([k]) => !setup.runTimeDependencies.includedInBundle.includes(k),
        )
        .map(([k, v]) => `${k}#${v}`),
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
        'grapesjs#0.18.3~css/grapes.min.css',
        'codemirror#5.52.0~codemirror.min.css',
        'codemirror#5.52.0~theme/blackboard.min.css',
    ],
    onEvent: (ev) => loadingScreen.next(ev),
})*/

Client['initialLoadingScreen'] = loadingScreen

await import('./on-load')
