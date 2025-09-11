const ENTRY_POINT_AND_PAGE_URL_PREFIX_MAP = {
	homepage: '/app/new-chat',
	dashboard: '/app/dashboard',
	report: '/app/reports',
	qna: '/app/new-chat/session/',
	workflow: '/app/business-process',
};

export const getEntryPointFromPageUrl = (pageUrl) => {
	const entryPointsAndUrlPrefix = Object.entries(
		ENTRY_POINT_AND_PAGE_URL_PREFIX_MAP,
	);
	for (let i = 0; i < entryPointsAndUrlPrefix.length; i++) {
		const [entryPoint, urlPrefix] = entryPointsAndUrlPrefix[i];
		if (pageUrl.includes(urlPrefix)) {
			return entryPoint;
		}
	}

	return '';
};

export function removeQueryString(url) {
	return url.split('?')[0];
}

export const getURLSearchParams = () => new URLSearchParams(window.location.search);
export const setUrlParam = (param, value) => {
	const sp = getURLSearchParams();
	if (value) sp.set(param, value);
	else sp.delete(param);
	const newUrl = `${window.location.pathname}?${sp.toString()}${window.location.hash}`;
	window.history.replaceState({}, '', newUrl);
};
