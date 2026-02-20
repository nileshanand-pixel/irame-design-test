import { useSelector } from 'react-redux';
import { ENABLE_RBAC } from '@/config';

export const useRbac = () => {
	const { is_rbac_enabled } = useSelector((state) => state.authStoreReducer || {});
	const isRbacActive = ENABLE_RBAC && is_rbac_enabled;
	return { isRbacActive, isRbacEnabled: is_rbac_enabled };
};
