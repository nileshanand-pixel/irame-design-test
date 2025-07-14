import { useParams } from 'react-router-dom';

export const useReportId = () => {
	const params = useParams();
	return params.reportId;
};
