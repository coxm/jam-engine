import {FileLoader} from 'jam/load/FileLoader';


const baseUrl: string = 'test-base-url';


function testFileLoader(testName: string, options: {
	loader: () => FileLoader;
	testCaching: boolean;
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

			if (options.testCaching) {
				it("caching the results", () => {
					const promise = loader.text(basename);
					expect(loader.cache).toBeTruthy();
					expect(loader.cache!.get(filename)).toBe(promise);
				});
			}
			else {
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

			if (options.testCaching) {
				it("caching the results", () => {
					const promise = loader.json(basename);
					expect(loader.cache).toBeTruthy();
					expect(loader.cache!.get(filename)).toBe(promise);
				});
			}
			else {
				it("without caching the results", (done): void => {
					const p = loader.json(basename);
					const q = loader.json(basename);
					expect(p).not.toBe(q);
					expect(System.import).toHaveBeenCalledTimes(2);
					Promise.all([p, q]).then(([a, b]): void => {
						expect(a).not.toBe(b);
						expect(a).toEqual(b);
						done();
					});
				});
			}
		});
	});
}


describe("FileLoader", (): void => {
	testFileLoader("initialised with specific cache", {
		loader: (): FileLoader => new FileLoader({
			baseUrl: baseUrl,
			cache: new Map<string, any>(),
		}),
		testCaching: true,
	});

	testFileLoader("initialised with caching enabled", {
		loader: (): FileLoader => new FileLoader({
			baseUrl: baseUrl,
			cache: true,
		}),
		testCaching: true,
	});

	testFileLoader("initialised with caching disabled", {
		loader: (): FileLoader => new FileLoader({
			baseUrl: baseUrl,
			cache: false,
		}),
		testCaching: false,
	});
});
