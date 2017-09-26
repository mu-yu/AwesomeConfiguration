const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const autoPrefixer = require('autoprefixer')

const isProd = process.env.NODE_ENV === 'prod'
const pages = ['pageA', 'pageB', 'pageC']

const extractSass = new ExtractTextPlugin({
  filename: 'css/[name].[contenthash].css',
  disable: !isProd,
})

const getEntrys = function() {
  let entryObj = {'babel-polyfill': 'babel-polyfill'}
  pages.forEach(page => {
    entryObj[page] = `./src/${page}/index.js`
  })

  return entryObj
}

module.exports = {
  entry: getEntrys(),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[id].chunk.js',
  },
  devtool: isProd ? false : '#cheap-module-eval-source-map',
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [
            {
              loader: 'css-loader',
              options: {sourceMap: !isProd},
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: !isProd,
                plugins: () => [
                  autoPrefixer({
                    browsers: ['ie >= 9', 'last 2 versions', '> 1%'],
                  }),
                ],
              },
            },
            {
              loader: 'sass-loader',
              options: {sourceMap: !isProd},
            },
          ],
          // use style-loader in development
          fallback: 'style-loader',
        }),
      },
      {
        test: /\.(js)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.join(__dirname, 'src')],
        options: {
          formatter: require('eslint-friendly-formatter'),
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.join(__dirname, 'src')],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'static/img/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'static/media/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'static/fonts/[name].[hash:7].[ext]',
        },
      },
    ],
  },
  plugins: [
    extractSass,
    new webpack.DefinePlugin({'process.env': JSON.stringify(process.env.NODE_ENV)}),
  ],
}

if (process.env.NODE_ENV === 'dev') {
  module.exports.plugins = (module.exports.plugins || []).concat([
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new FriendlyErrorsPlugin(),
    new HtmlWebpackPlugin(),
  ])

  pages.forEach((pageName) => {
    let pagePlugin = new HtmlWebpackPlugin({
      favicon: './static/favicon.ico',
      filename: `${pageName}.html`,
      template: `./src/${pageName}/${pageName}.html`,
      // inject: true,
      chunks: ['manifest', 'vendor', 'babel-polyfill', pageName],
      chunksSortMode: 'manual',
      // contentName: pageName,
    })
    module.exports.plugins.push(pagePlugin)
  })

  module.exports.devServer = {
    port: 9000,
    compress: true,
    hot: true, // Tell the dev-server we're using HMR
    contentBase: path.resolve(__dirname, 'dist'),
    proxy: {
      '/cloud_account': {
        target: 'http://local-crash.163.com:8181',
        changeOrigin: true,
      },
    },
  }
}

if (process.env.NODE_ENV === 'prod') {
  module.exports.output = {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[chunkhash].js',
    chunkFilename: 'js/[id].[chunkhash].js',
  }
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.optimize.UglifyJsPlugin({
      compress: {warnings: false},
      sourceMap: false,
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: {safe: true},
    }),
    // split vendor js into its own file
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module, count) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.startsWith(path.resolve(__dirname, './node_modules'))
        ) || count >= 2
      },
    }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor'],
    }),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'static'),
        to: path.resolve(__dirname, 'dist', 'static'),
        ignore: ['.*'],
      },
    ]),
  ])

  pages.forEach((pageName) => {
    let pagePlugin = new HtmlWebpackPlugin({
      favicon: './static/favicon.ico',
      filename: `${pageName}.html`,
      template: `./src/${pageName}/${pageName}.html`,
      // inject: false,
      chunks: ['manifest', 'vendor', 'babel-polyfill', pageName],
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'manual',
      // contentName: pageName,
    })
    module.exports.plugins.push(pagePlugin)
  })
}
