const path = require('path');
const webpack = require('webpack');


if (!process.env.NODE_ENV) {
  throw new Error("No NODE_ENV setting");
}
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || '3000';
const HOST = process.env.HOST || 'localhost';


const entry = [path.resolve(__dirname, 'src/index.ts')];
if (!IS_PROD) {
  entry.unshift(
    `webpack-dev-server/client?http://${HOST}:${PORT}`);
}
module.exports = {
  mode: IS_PROD ? 'production' : 'development',
  target: 'web',
  devtool: IS_PROD ? 'cheap-module' : 'cheap-module-source-map',
  entry,
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'index.js',
    library: 'jam-engine',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
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
        include: path.join(__dirname, 'src'),
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
