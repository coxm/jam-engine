import {
	FileLoader,
	cacheUnderFullPath,
	cacheUnderTypeAndFullPath,
}
from 'jam/load/FileLoader';


const baseUrl: string = 'test-base-url';


interface CachingFileLoader extends FileLoader {
	readonly cache: Map<string, any>;
}


class FullPathCachingFileLoader extends FileLoader {
	readonly cache: Map<string, any>;

	@cacheUnderFullPath
	text(relpath: string): Promise<string> {
		return super.text(relpath);
	}

	@cacheUnderFullPath
	json(relpath: string): Promise<string> {
		return super.json(relpath);
	}
}


class TypeAndFullPathCachingFileLoader extends FileLoader {
	readonly cache: Map<string, any>;

	@cacheUnderTypeAndFullPath
	text(relpath: string): Promise<string> {
		return super.text(relpath);
	}

	@cacheUnderTypeAndFullPath
	json(relpath: string): Promise<string> {
		return super.json(relpath);
	}
}


function testFileLoader(testName: string, options: {
	loader: () => FileLoader;
	cachePrefix: undefined | boolean
})
	: void
{
	describe(testName, (): void => {
		let loader: FileLoader = <any> null;
		let importCount: number = 0;

		beforeEach((): void => {
			loader = options.loader();
			importCount = 0;
		});

		describe("loads text files", () => {
			const fileContents: string = 'file contents';
			const basename: string = 'somefile.txt';
			const filename: string = baseUrl + '/' + basename;
			const expected: string = filename + '!text.js';

			beforeEach((): void => {
				spyOn(System, 'import').and.callFake((file: string)
					: Promise<string> =>
				{
					return (file === filename + '!text.js'
						? Promise.resolve(fileContents)
						: Promise.reject(
							`Expected '${expected}'; got '${file}'`)
					);
				});
			});

			it("returning the contents", (done) => {
				loader.text(basename).then(
					(result: string): void => {
						expect(result).toBe(fileContents);
						done();
					},
					(err: string): void => {
						console.error(err);
						fail(err);
					}
				);
			});

			if (options.cachePrefix === undefined) {
				it("without caching the results", (done): void => {
					const p = loader.text(basename);
					const q = loader.text(basename);
					expect(p).not.toBe(q);
					expect(System.import).toHaveBeenCalledTimes(2);
					Promise.all([p, q]).then(([a, b]): void => {
						expect(a).toBe(b);
						done();
					});
				});
			}
			else {
				it("caching the results", () => {
					const promise = loader.text(basename);
					const cache = (<CachingFileLoader> loader).cache;
					const key = (options.cachePrefix
						?	'text:' + filename
						:	filename
					);
					expect(cache).toBeTruthy();
					expect(cache!.get(key)).toBe(promise);
				});
			}
		});

		describe("loads JSON files", () => {
			const object: any = {
				some: ['J', 'S', 'O', 'N'],
			};
			const basename: string = 'somefile.json';
			const filename: string = baseUrl + '/' + basename;
			const expected: string = filename + '!text.js';

			beforeEach((): void => {
				spyOn(System, 'import').and.callFake((file: string)
					: Promise<string> =>
				{
					return (file === expected
						? Promise.resolve(JSON.stringify(object))
						: Promise.reject(
							`Expected '${expected}'; got '${file}'`)
					);
				});
			});

			it("returning the contents", (done) => {
				loader.json(basename).then(
					(result: any): void => {
						expect(result).toEqual(object);
						done();
					},
					(err: string): void => {
						console.error(err);
						fail(err);
					}
				);
			});

			if (options.cachePrefix === undefined) {
				it("without caching the results", (done): void => {
					const p = loader.json(basename);
					const q = loader.json(basename);
					expect(p).not.toBe(q);
					expect(System.import).toHaveBeenCalledTimes(2);
					Promise.all([p, q]).then(([a, b]): void => {
						expect(a).toEqual(b);
						expect(a).not.toBe(b);
						done();
					});
				});
			}
			else {
				it("caching the results", () => {
					const promise = loader.json(basename);
					const cache = (<CachingFileLoader> loader).cache;
					const key = (options.cachePrefix
						?	'json:' + filename
						:	filename
					);
					expect(cache).toBeTruthy();
					expect(cache!.get(key)).toBe(promise);
				});
			}
		});
	});
}


describe("FileLoader", (): void => {
	testFileLoader("initialised without suffix", {
		loader: () => new FileLoader({
			baseUrl: baseUrl,
		}),
		cachePrefix: undefined,
	});

	testFileLoader("initialised with '!text.js' suffix", {
		loader: () => new FileLoader({
			baseUrl: baseUrl,
			suffix: '!text.js',
		}),
		cachePrefix: undefined,
	});

	testFileLoader("when caching under full path (old behaviour)", {
		loader: () => new FullPathCachingFileLoader({
			baseUrl: baseUrl,
		}),
		cachePrefix: false,
	});

	testFileLoader("when caching under type and full path", {
		loader: () => new TypeAndFullPathCachingFileLoader({
			baseUrl: baseUrl,
		}),
		cachePrefix: true,
	});
});
