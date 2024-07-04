import axios from 'axios';
import { API_URL } from '@/config';
import { toast } from 'sonner';
import { logout } from '@/components/features/login/service/auth.service';

let isLoggingOut = false;

const axiosClient = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosClient.interceptors.response.use(
	(response) => {
		// If the response is successful, just return the response
		return response;
	},
	(error) => {
		// If the response has a status of 401, log out the user
		if (error.response && error.response.status === 401 && !isLoggingOut) {
            toast.error('Session expired. Logging out...');
			isLoggingOut = true;
			logout();
            resetAllStores();
		}
		return Promise.reject(error);
	}
);

export default axiosClient;
