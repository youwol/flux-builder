
const runTimeDependencies = {
    "load": {
        "@youwol/flux-svg-plots": "^0.0.1",
        "js-beautify": "^1.14.6",
        "@youwol/fv-tree": "^0.2.3",
        "grapesjs": "0.18.3",
        "@youwol/fv-group": "^0.2.1",
        "@youwol/flux-view": "^1.0.3",
        "@youwol/fv-button": "^0.1.1",
        "lodash": "^4.17.15",
        "@youwol/logging": "^0.0.2",
        "@youwol/cdn-client": "^1.0.2",
        "@youwol/os-top-banner": "^0.1.1",
        "@youwol/fv-tabs": "^0.2.1",
        "@youwol/fv-input": "^0.2.1",
        "@youwol/flux-core": "^0.2.1",
        "@youwol/fv-context-menu": "^0.1.1",
        "rxjs": "^6.5.5",
        "d3-selection": "^3.0.0",
        "d3-drag": "^3.0.0",
        "d3-scale": "^4.0.2",
        "d3-zoom": "^3.0.0"
    },
    "differed": {
        "codemirror": "^5.52.0"
    },
    "includedInBundle": [
        "d3-selection",
        "d3-drag",
        "d3-scale",
        "d3-zoom"
    ]
}
const externals = {
    "@youwol/flux-svg-plots": "window['@youwol/flux-svg-plots_APIv001']",
    "js-beautify": "window['js_beautify_APIv1']",
    "@youwol/fv-tree": "window['@youwol/fv-tree_APIv02']",
    "grapesjs": "window['grapesjs_APIv018']",
    "@youwol/fv-group": "window['@youwol/fv-group_APIv02']",
    "@youwol/flux-view": "window['@youwol/flux-view_APIv1']",
    "@youwol/fv-button": "window['@youwol/fv-button_APIv01']",
    "lodash": "window['__APIv4']",
    "@youwol/logging": "window['@youwol/logging_APIv002']",
    "@youwol/cdn-client": "window['@youwol/cdn-client_APIv1']",
    "@youwol/os-top-banner": "window['@youwol/os-top-banner_APIv01']",
    "@youwol/fv-tabs": "window['@youwol/fv-tabs_APIv02']",
    "@youwol/fv-input": "window['@youwol/fv-input_APIv02']",
    "@youwol/flux-core": "window['@youwol/flux-core_APIv02']",
    "@youwol/fv-context-menu": "window['@youwol/fv-context-menu_APIv01']",
    "rxjs": "window['rxjs_APIv6']",
    "codemirror": "window['CodeMirror_APIv5']",
    "rxjs/operators": "window['rxjs_APIv6']['operators']"
}
const exportedSymbols = {
    "@youwol/flux-svg-plots": {
        "apiKey": "001",
        "exportedSymbol": "@youwol/flux-svg-plots"
    },
    "js-beautify": {
        "apiKey": "1",
        "exportedSymbol": "js_beautify"
    },
    "@youwol/fv-tree": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-tree"
    },
    "grapesjs": {
        "apiKey": "018",
        "exportedSymbol": "grapesjs"
    },
    "@youwol/fv-group": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-group"
    },
    "@youwol/flux-view": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/flux-view"
    },
    "@youwol/fv-button": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/fv-button"
    },
    "lodash": {
        "apiKey": "4",
        "exportedSymbol": "_"
    },
    "@youwol/logging": {
        "apiKey": "002",
        "exportedSymbol": "@youwol/logging"
    },
    "@youwol/cdn-client": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/cdn-client"
    },
    "@youwol/os-top-banner": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/os-top-banner"
    },
    "@youwol/fv-tabs": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-tabs"
    },
    "@youwol/fv-input": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-input"
    },
    "@youwol/flux-core": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/flux-core"
    },
    "@youwol/fv-context-menu": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/fv-context-menu"
    },
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    },
    "codemirror": {
        "apiKey": "5",
        "exportedSymbol": "CodeMirror"
    }
}
export const setup = {
    name:'@youwol/flux-builder',
        assetId:'QHlvdXdvbC9mbHV4LWJ1aWxkZXI=',
    version:'0.1.0',
    shortDescription:"Low code application for YouWol platform",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/flux-builder',
    npmPackage:'https://www.npmjs.com/package/@youwol/flux-builder',
    sourceGithub:'https://github.com/youwol/flux-builder',
    userGuide:'https://l.youwol.com/doc/@youwol/flux-builder',
    apiVersion:'01',
    runTimeDependencies,
    externals,
    exportedSymbols,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    }
}
