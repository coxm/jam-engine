// As well as preventing pollution of the global scope, this function also
// prevents Chrome from making premature optimisations which cause errors.
window.__karma__.loaded = false;
window.__karma__.startJasmine = window.__karma__.start;
window.__karma__.start = function() {
	const TEST_REGEXP = /^\/base\/(build\/test\/.*)\.js$/;
	const globalModules = [];
	const testModules = Object.keys(this.files).filter(
		TEST_REGEXP.test.bind(TEST_REGEXP)
	);
	const initialImports = globalModules.concat(testModules);


	const meta = {
		// Explicitly tell SystemJS to use System.register with these modules.
		// Otherwise, when generating coverage reports, System incorrectly
		// interprets the Istanbul-preprocessed source files as global modules.
		"/base/build/js/*": {format: 'register'},
	};
	globalModules.forEach((filename) => {
		meta[filename] = {format: 'global'};
	});


	System.config({
		defaultJSExtensions: true,
		map: {
			"lodash": "node_modules/lodash",
			"systemjs": "node_modules/systemjs/dist/system.js",
			"jam": "build/js",
		},
		meta,
		transpiler: null,
	});


	// console.log('Importing', initialImports);
	Promise.all(initialImports.map(filename => System.import(filename))).then(
		() => {
			// console.log('Loaded; starting Karma');
			this.startJasmine();
		},
		(err) => { console.error(err.message || err); }
	);
};
window.onerror = function(e) {
	console.error(e.message || e);
};
