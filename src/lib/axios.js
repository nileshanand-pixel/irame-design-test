import axios from 'axios';
import { toast } from 'sonner';
import { ensureCleanup } from '@/components/features/login/service/auth.service';
import { serviceUrlMap } from '@/config/url.config';

let isLoggingOut = false;

// Client for the data manager service v1
const axiosClientV1 = axios.create({
	baseURL: serviceUrlMap.DATA_MANAGER_SERVICE_V1,
	headers: {
		'Content-Type': 'application/json',
		'x-app-token': 'e2bbb59e-d66f-4734-b034-cf6e8f3f8a4e'
	},
	withCredentials: true
});

// Client for the data manager service v2
const axiosClientV2 = axios.create({
	baseURL: serviceUrlMap.DATA_MANAGER_SERVICE_V2,
	headers: {
		'Content-Type': 'application/json',
		'x-app-token': 'e2bbb59e-d66f-4734-b034-cf6e8f3f8a4e'
	},
	withCredentials: true
});

const setupInterceptors = (axiosClient) => {
	axiosClient.interceptors.response.use(
		(response) => {
			return response;
		},
		async (error) => {
			if (error.response && error.response.status === 401 && !isLoggingOut) {
				isLoggingOut = true;
				await ensureCleanup();
			}
			return Promise.reject(error);
		},
	);
};

// Attach interceptors to both clients
setupInterceptors(axiosClientV1);
setupInterceptors(axiosClientV2);

export default axiosClientV1;
export { axiosClientV2 };
