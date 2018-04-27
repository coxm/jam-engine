const path = require('path');
const webpack = require('webpack');


if (!process.env.NODE_ENV) {
  throw new Error("No NODE_ENV setting");
}
const IS_DEV = process.env.NODE_ENV ==='development';
const IS_PROD = process.env.NODE_ENV === 'production';
const IS_TESTING = process.env.NODE_ENV === 'testing';
const PORT = process.env.PORT || '3000';
const HOST = process.env.HOST || 'localhost';


const entry = {
  lib: path.resolve(__dirname, 'src/index.ts'),
  test: path.resolve(__dirname, 'test/index.ts'),
  docs: path.resolve(__dirname, 'docs/index.ts'),
};
if (IS_DEV) {
  entry.serve = `webpack-dev-server/client?http://${HOST}:${PORT}`;
}


const output = {
  path: path.join(__dirname, 'build'),
  filename: '[name].js',
};
if (IS_PROD) {
  output.library = 'jam-engine';
  output.libraryTarget = 'umd';
  output.umdNamedDefine = true;
}


module.exports = {
  mode: IS_PROD ? 'production' : 'development',
  target: 'web',
  devtool: IS_PROD ? 'cheap-module' : 'cheap-module-source-map',
  entry,
  output,
  resolve: {
    alias: {
      jam: path.join(__dirname, 'src'),
    },
    extensions: ['.ts', '.js', '.d.ts'],
  },
  module: {
    rules: [
      {
        test: /\.(d\.)?ts$/,
        use: [{loader: 'awesome-typescript-loader'}],
      },
      {
        test: /\.(sass|scss)$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ]
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(!IS_PROD),
      __PROD__: JSON.stringify(IS_PROD),
      __BUILD__: JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};
