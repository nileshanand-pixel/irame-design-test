import axios from 'axios';
import { toast } from 'sonner';
import { logout } from '@/components/features/login/service/auth.service';
import { serviceUrlMap } from '@/config/url.config';

let isLoggingOut = false;

// Client for the first backend
const axiosClient = axios.create({
    baseURL: serviceUrlMap.DATA_MANAGER_SERVICE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Client for the second backend
const authAxiosClient = axios.create({
    baseURL: serviceUrlMap.OAUTH_SERVICE,
    headers: {
        'Content-Type': 'application/json',
    },
});

const setupInterceptors = (axiosClient) => {
    axiosClient.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response && error.response.status === 401 && !isLoggingOut) {
                toast.error('Session expired. Logging out...');
                isLoggingOut = true;
                logout();
                resetAllStores();
            }
            return Promise.reject(error);
        }
    );
};

// Attach interceptors to both clients
setupInterceptors(axiosClient);
setupInterceptors(authAxiosClient);

export default axiosClient;
export {authAxiosClient };
