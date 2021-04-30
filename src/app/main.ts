
// Following import is to include style.css in the dist directory (using MiniCssExtractPlugin)
// (index.html is handled by HtmlWebpackPlugin)

export{}

let css = require('./style.css');


let cdn = window['@youwol/cdn-client']

let [linkBA, linfFA, linkYW, _] = await cdn.fetchStyleSheets([
    "bootstrap#4.4.1~bootstrap.min.css",
    "fontawesome#5.12.1~css/all.min.css",
    "@youwol/fv-widgets#0.0.3~dist/assets/styles/style.youwol.css",
    "grapes#0.16.2~css/grapes.min.css",
    "codemirror#5.52.0~codemirror.min.css",
    "codemirror#5.52.0~theme/blackboard.min.css",
])
linkBA.id = "bootstrap-css"; linkYW.id = "youwol-css"; linfFA.id = "fontawesome-css"


window['codemirror'] = {}  // code mirror will be fetched in due time (when opening the editor)

await cdn.fetchBundles(
    {
        'lodash': '4.17.15',
        "grapes": '0.16.2',
        "@youwol/flux-core": 'latest',
        "@youwol/flux-svg-plots": '0.0.0',
        '@youwol/flux-view': 'latest',
        "@youwol/fv-group": "latest",
        "@youwol/fv-button": "latest",
        "@youwol/fv-tree": "latest",
        "@youwol/fv-tabs": "latest",
        "@youwol/fv-input": "latest",
        "@youwol/fv-context-menu": "latest",
        "rxjs": '6.5.5',
    },
    window
)

await import('./on-load')

