import { GOOGLE_AUTH_API_URL, STAGE_BASE_URL, GATEKEEPER_BASE_URL } from '.';

const servicePathMap = {
	DATA_MANAGER_V1: '/datamanager/app/v1',
	DATA_MANAGER_V2: '/datamanager/app/v2',
	DATA_MANAGER_V3: '/datamanager/app/v3',
	GATEKEEPER_V1: 'gatekeeper/v1',
	OAUTH: '/oauth',
};

// Build service URLs safely: avoid duplicating path segments (e.g., /v1/v1)
const safeJoin = (base, path) => {
	if (!base) return path;
	const cleanedBase = base.replace(/\/+$/g, '');
	const cleanedPath = path.startsWith('/') ? path : `/${path}`;
	// If base already ends with the same path segment, don't append it again
	if (path && cleanedBase.endsWith(path)) return cleanedBase;
	return `${cleanedBase}${cleanedPath}`;
};

export const serviceUrlMap = {
	DATA_MANAGER_SERVICE_V1: `${STAGE_BASE_URL}${servicePathMap.DATA_MANAGER_V1}`,
	DATA_MANAGER_SERVICE_V2: `${STAGE_BASE_URL}${servicePathMap.DATA_MANAGER_V2}`,
	DATA_MANAGER_SERVICE_V3: `${STAGE_BASE_URL}${servicePathMap.DATA_MANAGER_V3}`,
	GATEKEEPER_SERVICE_V1: safeJoin(
		GATEKEEPER_BASE_URL,
		servicePathMap.GATEKEEPER_V1,
	),
	OAUTH_SERVICE: `${STAGE_BASE_URL}${servicePathMap.OAUTH}`,
	AUTH_SERVICE: GOOGLE_AUTH_API_URL,
};
