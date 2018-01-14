const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const entry = {
  index: path.join(__dirname, 'lib', 'index.js')
};

const resolve = {
  mainFields: ["browser", "module", "main"]
};

const mod = {
  rules: [
    {
      test: /\.(js)$/,
      exclude: [
        /node_modules/
      ],
      loader: 'babel-loader'
    }
  ]
};

const browserConfig = {
  target: 'web',
  context: __dirname,
  resolve,
  entry,
  output: {
    filename: 'npmProfileAggregator.js',
    path: __dirname,
    publicPath: '/',
    library: 'npmProfileAggregator',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: mod,
  stats: 'errors-only',
  plugins: [],
  externals: [],
  devtool: 'source-map'
};

const windowConfig = Object.assign({}, browserConfig, {
  plugins: [new webpack.optimize.UglifyJsPlugin({
    compress: true,
    comments: false,
    sourceMap: true
  })],
  output: {
    filename: 'npmProfileAggregator.min.js',
    path: __dirname,
    publicPath: '/',
    library: 'npmProfileAggregator',
    libraryTarget: 'umd',
    umdNamedDefine: true
  }
})

const nodeConfig = {
  target: 'node',
  context: __dirname,
  resolve,
  entry,
  output: {
    filename: 'npmProfileAggregator.node.js',
    path: __dirname,
    publicPath: '/',
    library: 'npmProfileAggregator',
    libraryTarget: 'umd',
  },
  module: mod,
  stats: 'errors-only',
  plugins: [],
  externals: [nodeExternals()],
  devtool: 'source-map'
};

module.exports = [browserConfig, windowConfig, nodeConfig];
