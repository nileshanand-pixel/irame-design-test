import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useQuery } from '@tanstack/react-query';
import { fetchDataSources } from '@/services/data-source.service';
const useDataSourceName = (dataSourceId) => {
	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.util);

	const {
		data: dataSources,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['data-sources'],
		queryFn: fetchDataSources,
		onSuccess: (data) => {
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		},
	});

	const dataSource = dataSources?.find(
		(source) => source.datasource_id === dataSourceId,
	);

	return { dataSourceName: dataSource?.name, isLoading, error };
};
