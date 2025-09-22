import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDataSourceById } from '../../configuration/service/configuration.service';
import { useDatasourceId } from '@/hooks/use-datasource-id';
import SelectPrompt from '../SelectPromt';
import { DatasourceProcessingLoader } from './datasource-processing-loader';
import { isUnstructuredData } from '@/utils/datasource-utils';
import { queryClient } from '@/lib/react-query';
import useDatasourceDetails from '@/api/datasource/hooks/useDataSourceDetails';

const StepThreeContent = ({ setPrompt, dataSources }) => {
	const [processingState, setProcessingState] = useState(-1);
	const [processingComplete, setProcessingComplete] = useState(false);
	const datasourceId = useDatasourceId();

	const { data: datasource, isLoading } = useDatasourceDetails({
		queryOptions: {
			onSuccess: (data) => {
				if (data?.status === 'active') {
					setProcessingState(1);
					queryClient.invalidateQueries(['data-sources']);
				} else {
					setProcessingState(0);
					// setProcessingComplete(false);
				}
			},
			// refetchInterval: 1000,
			refetchInterval: ({ state }) => {
				const data = state?.data;
				if (data?.status !== 'active') {
					return 2000;
				}
				return false; // Stop polling once complete
			},
			// queryKey: ["data-source-details", datasourceId]
		},
	});

	// Determine if all files are document types
	const isAllDocuments = () => {
		return isUnstructuredData(datasource?.processed_files?.files);
	};

	// Show loader for document files, show select prompt for data files
	if (isLoading) {
		return <div>Loading datasource information...</div>;
	}

	// If all files are documents and processing is not complete, show loader
	if (isAllDocuments()) {
		return (
			<DatasourceProcessingLoader
				isLoading={datasource?.status !== 'active'}
			/>
		);
	}

	// For data files or when processing is complete, show SelectPrompt
	if (!isAllDocuments())
		return <SelectPrompt setPrompt={setPrompt} dataSources={dataSources} />;
};

export default StepThreeContent;
