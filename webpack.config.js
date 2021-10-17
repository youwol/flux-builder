const path = require('path')
const ROOT = path.resolve(__dirname, 'src/app')
const DESTINATION = path.resolve(__dirname, 'dist')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

// const BundleAnalyzerPlugin =
//   require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  context: ROOT,
  mode: 'development',
  entry: {
    main: './main.ts',
    //'dependencies': './dependencies-loader.ts'
  },
  experiments: {
    topLevelAwait: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'style.[contenthash].css',
      insert: '#css-anchor',
    }),
    new HtmlWebpackPlugin({
      //hash: true,
      title: 'Flux Builder',
      template: './index.html',
      filename: './index.html',
    }),
    //new BundleAnalyzerPlugin()
  ],
  output: {
    filename: '[name].[contenthash].js',
    path: DESTINATION,
  },

  resolve: {
    extensions: ['.ts', '.js'],
    modules: [ROOT, 'node_modules'],
  },
  externals: [
    {
      grapesjs: "window['grapesjs']",
      lodash: "window['_']",
      d3: "window['d3']",
      rxjs: "window['rxjs']",
      'rxjs/operators': "window['rxjs']['operators']",
      '@youwol/cdn-client': "window['@youwol/cdn-client']",
      '@youwol/flux-core': "window['@youwol/flux-core']",
      '@youwol/flux-svg-plots': "window['@youwol/flux-svg-plots']",
      '@youwol/flux-view': "window['@youwol/flux-view']",
      '@youwol/fv-group': "window['@youwol/fv-group']",
      '@youwol/fv-input': "window['@youwol/fv-input']",
      '@youwol/fv-tree': "window['@youwol/fv-tree']",
      '@youwol/fv-button': "window['@youwol/fv-button']",
      '@youwol/fv-tabs': "window['@youwol/fv-tabs']",
      '@youwol/fv-context-menu': "window['@youwol/fv-context-menu']",
      codemirror: "window['codemirror']",
    },
  ],
  module: {
    rules: [
      /****************
       * PRE-LOADERS
       *****************/
      {
        enforce: 'pre',
        test: /\.js$/,
        use: 'source-map-loader',
      },

      /****************
       * LOADERS
       *****************/
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        use: 'ts-loader',
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  devtool: 'cheap-module-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, './src'),
    historyApiFallback: true,
    inline: true,
    open: false,
    port: 3005,
  },
}
