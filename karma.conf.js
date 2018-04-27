const path = require('path');


const srcFiles = 'src/**/*.ts';
const testFiles = 'test/**/*.ts';


module.exports = function(config) {
	const reporters = ['progress'];
	const preprocessors = {
		[srcFiles]: ['webpack'],
		[testFiles]: ['webpack'],
	};
	const plugins = [
		'karma-jasmine',
		'karma-chrome-launcher',
		'karma-webpack',
	];
	if (process.argv.find((arg) => arg.includes('coverage'))) {
		reporters.push('coverage');
		preprocessors[testFiles].push('coverage');
		plugins.push('karma-coverage');
	}
	console.log('preprocessors', preprocessors);

	config.set({
		mode: process.env.NODE_ENV,
		basePath: __dirname,
		plugins: plugins,
		frameworks: ['jasmine'],
		files: [
			{pattern: 'test/**/*.ts', included: true, watched: true},
			// `http://${server.HOST}:${server.PORT}/test.js`,
		],
		exclude: [
		],
		webpack: {
			mode: 'development',
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
		},
		webpackMiddleware: {
			noInfo: true,
		},
		preprocessors,
		reporters: reporters,
		coverageReporter: {
			dir: 'build/coverage',
			reporters: [
				{type: 'html', subdir: 'html'}
			],
		},
		port: 9876,
		colors: true,
		// Possible values: config.LOG_DISABLE || config.LOG_ERROR ||
		// config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_DEBUG,
		autoWatch: true,
		browsers: ['Chrome'],
		singleRun: false,

		// Maximum number of browsers to start simultaneously.
		concurrency: 3
	})
}
