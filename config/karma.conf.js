module.exports = function(config) {
	const reporters = ['progress'];
	const preprocessors = {};
	const plugins = [
		'karma-jasmine',
		'karma-systemjs',
		'karma-chrome-launcher'
	];
	if (process.argv.find((arg) => arg.includes('coverage'))) {
		reporters.push('coverage');
		preprocessors['build/js/**/*.js'] = ['coverage'];
		plugins.push('karma-coverage');
	}

	config.set({
		basePath: '..',
		plugins: plugins,
		frameworks: ['systemjs', 'jasmine'],
		files: [
			'config/karma.system.js',
			{pattern: 'build/js/*.js', included: false},
			{pattern: 'build/js/**/*.js', included: false},
			{pattern: 'build/test/**/*.js', included: false},
			{pattern: 'node_modules/**/*.js', included: false, watched: false},
			'node_modules/pixi.js/dist/pixi.min.js'
		],
		exclude: [
		],
		preprocessors: preprocessors,
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
		logLevel: config.LOG_INFO,
		autoWatch: true,
		browsers: ['Chrome'],
		singleRun: false,

		// Maximum number of browsers to start simultaneously.
		concurrency: 3
	})
}
