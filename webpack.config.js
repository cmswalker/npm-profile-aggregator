const path = require('path');
const webpack = require('webpack');

const ENV = process.env.NODE_ENV || 'development';
const isProduction = ENV === 'production';

console.log('BUILDING WEBPACK FOR ENV', ENV, isProduction);

const config = {
  context: __dirname, // string (absolute path!)

  entry: {
    index: path.join(__dirname, 'index.js')
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, '/dist/'),
    publicPath: '/',
    chunkFilename: '[id].chunk.js'
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: [
          /node_modules/
        ],
        loader: 'babel-loader'
      }
    ]
  },

  target: 'web',
  stats: 'errors-only',

  plugins: [],
  externals: [],

  devtool: 'source-map'
}

if (isProduction) {
  config.output = {
    filename: 'myNpmProfile.js',
    path: __dirname,
    publicPath: '/',
    library: 'myNpmProfile',
    libraryTarget: 'umd',
    umdNamedDefine: true
  };

  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: true,
      comments: false,
      sourceMap: true
    })
  );
}

console.log('Wepback Config', config);

module.exports = config;
