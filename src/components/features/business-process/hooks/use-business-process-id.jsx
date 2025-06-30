import { useParams } from 'react-router-dom';

export const useBusinessProcessId = () => {
	const params = useParams();
	return params.businessProcessId;
};
