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

	// console.log(isLoading, "isLoading");

	// Determine if all files are document types
	const isAllDocuments = () => {
		if (!datasource?.raw_files || datasource.raw_files.length === 0) {
			return false;
		}

		return isUnstructuredData(datasource.raw_files);
	};

	// console.log(isAllDocuments(), processingComplete, isAllDocuments() && !processingComplete, "isAllDocuments() && !processingComplete")
	// Show loader for document files, show select prompt for data files
	if (isLoading) {
		return <div>Loading datasource information...</div>;
	}

	// if(isAllDocuments()) {

	// }
	console.log(datasource?.status, 'datasource?.status');
	// If all files are documents and processing is not complete, show loader
	if (isAllDocuments()) {
		return (
			<DatasourceProcessingLoader
				isLoading={datasource?.status !== 'active'}
			/>
		);
	}

	// if(isAllDocuments() && ) {
	// 	return (
	// 		<div className="flex space-x-2  text-base animate-in fade-in slide-in-from-bottom-4 duration-700">
	// 			<div className="flex-shrink-0">
	// 				<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-500 delay-200">
	// 					<Check className="w-5 h-5 text-white" />
	// 				</div>
	// 			</div>
	// 			<div className="font-medium text-primary80">Datasource is ready! Start asking questions to get actionable insights.</div>
	// 		</div>
	// 	)
	// }

	// For data files or when processing is complete, show SelectPrompt
	if (!isAllDocuments())
		return <SelectPrompt setPrompt={setPrompt} dataSources={dataSources} />;
};

export default StepThreeContent;
