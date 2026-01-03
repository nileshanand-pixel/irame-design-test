import { GOOGLE_AUTH_API_URL, STAGE_BASE_URL } from '.';

const servicePathMap = {
	DATA_MANAGER_V1: '/datamanager/app/v1',
	DATA_MANAGER_V2: '/datamanager/app/v2',
	DATA_MANAGER_V3: '/datamanager/app/v3',
	OAUTH: '/oauth',
};

export const serviceUrlMap = {
	DATA_MANAGER_SERVICE_V1: `${STAGE_BASE_URL}${servicePathMap.DATA_MANAGER_V1}`,
	DATA_MANAGER_SERVICE_V2: `${STAGE_BASE_URL}${servicePathMap.DATA_MANAGER_V2}`,
	DATA_MANAGER_SERVICE_V3: `${STAGE_BASE_URL}${servicePathMap.DATA_MANAGER_V3}`,
	OAUTH_SERVICE: `${STAGE_BASE_URL}${servicePathMap.OAUTH}`,
	AUTH_SERVICE: GOOGLE_AUTH_API_URL,
};
