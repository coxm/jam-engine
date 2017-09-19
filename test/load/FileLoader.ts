import {FileLoader} from 'jam/load/FileLoader';


const baseUrl: string = 'test-base-url';


function testFileLoader(testName: string, options: {
	loader: () => FileLoader;
	defaultExtension: string;
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
			const basename: string = 'somefile';
			const filename: string =
				[baseUrl, '/', basename, options.defaultExtension].join('');

			beforeEach((): void => {
				const fakeResponse = {
					text: () => Promise.resolve(fileContents),
				};
				spyOn(window, 'fetch').and.callFake((file: string) => {
					return (file === filename
						?	Promise.resolve(fakeResponse)
						:	Promise.reject(
								`Expected '${filename}'; got '${file}'`));
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

			it("without caching the results", (done): void => {
				const p = loader.text(basename);
				const q = loader.text(basename);
				expect(p).not.toBe(q);
				expect(window.fetch).toHaveBeenCalledTimes(2);
				Promise.all([p, q]).then(([a, b]): void => {
					expect(a).toBe(b);
					done();
				});
			});
		});

		describe("loads JSON files", () => {
			const object: any = {
				some: ['J', 'S', 'O', 'N'],
			};
			const basename: string = 'somefile';
			const filename: string =
				[baseUrl, '/', basename, options.defaultExtension].join('');

			beforeEach((): void => {
				const fakeResponse = {
					json: () => Promise.resolve(Object.assign({}, object)),
				};
				spyOn(window, 'fetch').and.callFake((file: string) => {
					return (file === filename
						?	Promise.resolve(fakeResponse)
						:	Promise.reject(
								`Expected '${filename}'; got '${file}'`));
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

			it("without caching the results", (done): void => {
				const p = loader.json(basename);
				const q = loader.json(basename);
				expect(p).not.toBe(q);
				expect(window.fetch).toHaveBeenCalledTimes(2);
				Promise.all([p, q]).then(([a, b]): void => {
					expect(a).toEqual(b);
					expect(a).not.toBe(b);
					done();
				});
			});
		});
	});
}


describe("FileLoader", (): void => {
	testFileLoader("initialised without defaultExtension", {
		loader: () => new FileLoader({
			baseUrl: baseUrl,
		}),
		defaultExtension: '',
	});

	testFileLoader("initialised with '.txt' defaultExtension", {
		loader: () => new FileLoader({
			baseUrl: baseUrl,
			defaultExtension: '.txt',
		}),
		defaultExtension: '.txt',
	});
});
