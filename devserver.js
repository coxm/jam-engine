const path = require('path');

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config');


const ROOT_DIR = path.resolve('.');
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || '3000';
const HOST = process.env.HOST || 'localhost';


const serverConfig = {
  contentBase: [
		'lib',
    ROOT_DIR,
  ],
  hot: false,
};


const server = new WebpackDevServer(webpack(config), serverConfig);


server.listen(PORT, HOST, (err, result) => {
  if (err) {
    console.error(err);
  }
  else {
    console.log('Development server listening at %s:%d', HOST, PORT);
  }
});
