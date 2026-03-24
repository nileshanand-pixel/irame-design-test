import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

const useDataSourceName = (dataSourceId) => {
	const { data, isLoading, error } = useDatasourceDetailsV2({
		datasourceId: dataSourceId,
	});

	return { dataSourceName: data?.name, isLoading, error };
};

export default useDataSourceName;
