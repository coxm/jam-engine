import {BaseLoader} from 'jam/load/BaseLoader';


describe("BaseLoader", (): void => {
	describe("expandPath method", (): void => {
		it("prepends nothing if no baseUrl", (): void => {
			expect((new BaseLoader()).expandPath('rel/path')).toBe('rel/path');
		});
		it("prepends the baseUrl if given", (): void => {
			const loader = new BaseLoader({
				baseUrl: '/base/url',
			});
			expect(loader.expandPath('rel/path')).toBe('/base/url/rel/path');
		});
		it("appends nothing if the path has an extenion", (): void => {
			const loader = new BaseLoader({
				baseUrl: '/base/url',
				defaultExtension: '.yaml',
			});
			expect(loader.expandPath('path.txt')).toBe('/base/url/path.txt');
		});
		it("appends the defaultExtension if given", (): void => {
			const loader = new BaseLoader({
				baseUrl: '/base/url',
				defaultExtension: '.yaml',
			});
			expect(loader.expandPath('some/path')).toBe(
				'/base/url/some/path.yaml');
		});
	});
});
