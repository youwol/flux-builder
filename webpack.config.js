const path = require('path');
const webpack = require('webpack');
const ROOT = path.resolve( __dirname, 'src/app' );
const DESTINATION = path.resolve( __dirname, 'dist' );
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    context: ROOT,
    mode: 'development',
    entry: {
        'main': './main.ts',
        //'dependencies': './dependencies-loader.ts'
    },
    experiments: {
        topLevelAwait: true
    },
    plugins: [
        new MiniCssExtractPlugin( {
            filename:"style.[contenthash].css",
            insert: "#css-anchor"
        } ),
        new HtmlWebpackPlugin({
            //hash: true,
            title: 'Flux Builder', 
            template: './index.html',
            filename: './index.html' 
        }),
        //new BundleAnalyzerPlugin()
   ],
    output: {
        filename: '[name].[contenthash].js',
        path: DESTINATION
    },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },
    externals : [
        {   /*
            We load the version used by flux-builder in window['flux-builder'] to not
            mix with the dependencies the project will load
            */
            "grapesjs": "window['grapesjs']",
            "lodash": "window['flux-builder']['_']",
            "d3":"window['flux-builder']['d3']",
            "rxjs": "window['flux-builder']['rxjs']",
            "rxjs/operators": "window['flux-builder']['rxjs']['operators']",
            "@youwol/cdn-client": "window['flux-builder']['@youwol/cdn-client']",
            "@youwol/flux-core": "window['flux-builder']['@youwol/flux-core']",
            "@youwol/flux-svg-plots": "window['flux-builder']['@youwol/flux-svg-plots']",
            "@youwol/flux-view": "window['flux-builder']['@youwol/flux-view']",
            '@youwol/fv-group':"window['flux-builder']['@youwol/fv-group']",
            '@youwol/fv-input':"window['flux-builder']['@youwol/fv-input']",
            '@youwol/fv-tree':"window['flux-builder']['@youwol/fv-tree']",
            '@youwol/fv-button':"window['flux-builder']['@youwol/fv-button']",    
            '@youwol/fv-tabs':"window['flux-builder']['@youwol/fv-tabs']",    
            '@youwol/fv-context-menu':"window['flux-builder']['@youwol/fv-context-menu']", 
            'codemirror':"window['flux-builder']['codemirror']", 
        }
      ],
    module: {
        rules: [
            /****************
            * PRE-LOADERS
            *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            },

            /****************
            * LOADERS
            *****************/
            {
                test: /\.ts$/,
                exclude: [ /node_modules/ ],
                use: 'ts-loader'
            }, 
            {
                test: /\.css$/i,
                use: [  MiniCssExtractPlugin.loader, 'css-loader' ]
            }
        ]
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        contentBase: path.resolve(__dirname, "./src"),
        historyApiFallback: true,
        inline: true,
        open: false,
        port:3005,
    }
};

