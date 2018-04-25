import {CachedFileLoader} from 'jam/load/CachedFileLoader';


describe("CachedFileLoader", (): void => {
	const relpath = 'rel/path';
	let fetchSpy: jasmine.Spy;
	let loader: CachedFileLoader;

	const responseText = 'some text contents';
	const responseJSON = {some: 'json object'};

	beforeEach((): void => {
		fetchSpy = spyOn(window, 'fetch');
		loader = new CachedFileLoader({
			baseUrl: 'base/url',
		});
	});

	function testMethod(name: string, expectedResult: any): void {
		describe(`${name} method`, () => {
			beforeEach((): void => {
				const response = {
					text(): Promise<string> {
						return Promise.resolve(responseText);
					},
					json(): Promise<any> {
						return Promise.resolve(responseJSON);
					},
				};
				fetchSpy.and.returnValue(Promise.resolve(response));
			});

			it(`loads ${name} the first time`, (done) => {
				(loader as any)[name](relpath).then((result: any) => {
					expect(result).toBe(expectedResult);
					done();
				});
			});
			it("uses cached values in subsequent calls", async function(done) {
				const result = await (loader as any)[name](relpath);
				expect(result).toBe(expectedResult);
				fetchSpy.and.returnValue(null);

				// Sanity check.
				const newFetched: any = await fetch(relpath);
				expect(newFetched).toBe(null);

				const subsequent = await (loader as any)[name](relpath);
				expect(subsequent).toBe(expectedResult);
				done();
			});
			it("uses values from the cache if possible", async function(done) {
				loader.cache.set(relpath, expectedResult);
				expect(await (loader as any)[name](relpath))
					.toBe(expectedResult);
				done();
			});
		});
	}

	testMethod('text', responseText);
	testMethod('json', responseJSON);
});
