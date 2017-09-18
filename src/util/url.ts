export const extensionRegex = /(.[a-zA-Z0-9]+)$/;


export const protocolRegex = /^([a-z]+):\/\//;


export const isAbsolute = (url: string): boolean =>
	url.startsWith('/') ||
	protocolRegex.test(url);


export const resolve = (function(): string {
	const last = arguments.length - 1;
	let fragment: string = arguments[last];
	if (isAbsolute(fragment)) {
		return fragment;
	}

	const fragments: string[] = fragment ? [fragment] : [];
	for (let i = last - 1; i >= 0; --i) {
		fragment = arguments[i];
		if (!fragment) {
			continue;
		}
		fragments.unshift(fragment.replace(/\/$/, ''));
		if (isAbsolute(fragment)) {
			break;
		}
	}
	return fragments.join('/');
}) as {(...args: string[]): string;};
