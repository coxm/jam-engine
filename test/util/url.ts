import * as url from 'jam/util/url';


describe("extensionRegex", (): void => {
	it("can identify file extensions", (): void => {
		const cases = {
			'somefile.txt': '.txt',
			'http://site/file.blend': '.blend',
			'some/path/to/an/image.png': '.png',
			'/abspath/to/an/image.png': '.png',
		};
		for (const path in cases) {
			expect(url.extensionRegex.test(path)).toBe(true);
			const match = url.extensionRegex.exec(path);
			expect(match).toBeTruthy();
			expect(match![1]).toBe(cases[path]);
		}
	});

	it("excludes URLs without an extension", (): void => {
		const cases = [
			'somefile',
			'http://site/file',
			'some/path/to/an/image',
			'/abspath/to/an/image',
		];
		for (const path in cases) {
			expect(url.extensionRegex.test(path)).toBe(false);
		}
	});
});


describe("protocolRegex", (): void => {
	it("can identify protocols", (): void => {
		const cases = {
			'http://something.com/article': 'http',
			'file:///home/user/some/file.txt': 'file',
		};
		for (const path in cases) {
			expect(url.protocolRegex.test(path)).toBe(true);
			const match = url.protocolRegex.exec(path);
			expect(match).toBeTruthy();
			expect(match![1]).toBe(cases[path]);
		}
	});

	it("excludes URLs without a protocol", (): void => {
		const cases = [
			'somefile.txt',
			'http://site/file',
			'some/path/to/an/image.jpg',
			'/abspath/to/an/image',
		];
		for (const path in cases) {
			expect(url.protocolRegex.test(path)).toBe(false);
		}
	});
});


describe("isAbsolute function", (): void => {
	it("correctly identifies URLs", (): void => {
		const paths = {
			'somefile.txt': false,
			'http://site/file.blend': true,
			'some/path/to/an/image.png': false,
			'/abspath/to/an/image.png': true,
		};
		for (const path in paths) {
			expect(url.isAbsolute(path)).toBe(paths[path]);
		}
	});
});


describe("resolve function", (): void => {
	it("joins URL fragments", (): void => {
		expect(url.resolve('a/b', 'c/d')).toBe('a/b/c/d');
	});
	it("doesn't add unnecessary slashes", (): void => {
		expect(url.resolve('a/b/', 'c/d')).toBe('a/b/c/d');
	});
	it("respects initial slashes", (): void => {
		expect(url.resolve('/a/b/', 'c/d')).toBe('/a/b/c/d');
	});
	it("respects final slashes", (): void => {
		expect(url.resolve('a/b/', 'c/d/')).toBe('a/b/c/d/');
	});
	it("respects absolute URLs", (): void => {
		expect(url.resolve('a/b/', '/c/d')).toBe('/c/d');
	});
	it("uses the most recent absolute URL", (): void => {
		expect(url.resolve('/a', 'b', '/c', 'd', '/e', 'f')).toBe('/e/f');
	});
});
