import { GOOGLE_AUTH_API_URL, STAGE_BASE_URL } from "."

const servicePathMap = {
    DATA_MANAGER: '/datamanager/app/v1',
    OAUTH: '/oauth'
}

export const serviceUrlMap = {
    DATA_MANAGER_SERVICE: `${STAGE_BASE_URL}${servicePathMap.DATA_MANAGER}`,
    OAUTH_SERVICE: `${STAGE_BASE_URL}${servicePathMap.OAUTH}`,
    AUTH_SERVICE: GOOGLE_AUTH_API_URL
}