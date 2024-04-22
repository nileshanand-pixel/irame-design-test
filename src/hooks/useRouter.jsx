import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import queryString from 'query-string';

export function useRouter() {
	const params = useParams();
	const location = useLocation();
	const navigate = useNavigate();

	return useMemo(() => {
		return {
			pathname: location.pathname,
			query: {
				...queryString.parse(location.search),
				...params,
			},
			// match,
			location,
			navigate,
			params,
		};
	}, [params, location, navigate]);
}
