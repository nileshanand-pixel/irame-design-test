import { useDataSources } from '@/hooks/useDataSources';

const useDataSourceName = (dataSourceId) => {
	const { dataSources, isLoading, error } = useDataSources();

	const dataSource = dataSources?.find(
		(source) => source.datasource_id === dataSourceId,
	);

	return { dataSourceName: dataSource?.name, isLoading, error };
};

export default useDataSourceName;
