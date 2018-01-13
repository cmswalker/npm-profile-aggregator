const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const resolve = {
  mainFields: ["browser", "module", "main"]
};

const browserConfig = {
  target: 'web',
  context: __dirname,
  resolve,
  entry: {
    index: path.join(__dirname, 'lib', 'index.js')
  },
  output: {
    filename: 'npmProfileAggregator.js',
    path: __dirname,
    publicPath: '/',
    library: 'npmProfileAggregator',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: [
          /node_modules/
        ],
        loader: 'babel-loader'
      }
    ]
  },
  stats: 'errors-only',
  plugins: [new webpack.optimize.UglifyJsPlugin({
    compress: true,
    comments: false,
    sourceMap: true
  })],
  externals: [],
  devtool: 'source-map'
};

const nodeConfig = {
  target: 'node',
  context: __dirname,
  resolve,
  entry: {
    index: path.join(__dirname, 'lib', 'index.js')
  },
  output: {
    filename: 'npmProfileAggregator.node.js',
    path: __dirname,
    publicPath: '/',
    library: 'npmProfileAggregator',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: [
          /node_modules/
        ],
        loader: 'babel-loader'
      }
    ]
  },
  stats: 'errors-only',
  plugins: [],
  externals: [nodeExternals()],
  devtool: 'source-map'
};

module.exports = [browserConfig, nodeConfig];
