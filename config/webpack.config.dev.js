  const {resolve} = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

const commonConfig = require('./webpack.config.common');

module.exports = merge(commonConfig, {
  mode: 'development',
  entry: [`webpack-hot-middleware/client?http://localhost:${process.env.HTTP_PORT}&reload=true&overlay=false`],
  output: {
    hotUpdateMainFilename: 'hot-update.[hash:6].json',
    hotUpdateChunkFilename: 'hot-update.[hash:6].js'
  },
  module: {
    rules:  [
              {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                  'file-loader'
                ]
              }
            ]
  },
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
      template: resolve(__dirname, '..', 'src', 'client', 'index.html'),
      // favicon: resolve(__dirname, '..', 'src', 'client', 'static', 'favicon.png'),
      alwaysWriteToDisk: true
    }),
    new HtmlWebpackHarddiskPlugin({
      outputPath: resolve(__dirname, '..', 'build-dev', 'client')
    })
  ]
});