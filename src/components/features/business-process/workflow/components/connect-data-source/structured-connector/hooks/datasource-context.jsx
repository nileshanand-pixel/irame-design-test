import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { useDatasourceId } from '@/hooks/use-datasource-id';
import { setUrlParam } from '@/utils/url';
import { createEmptyDatasource } from '@/components/features/configuration/service/configuration.service';
import { useWorkflowRunId } from '@/components/features/business-process/hooks/use-workflow-run-id';
import { toast } from '@/lib/toast';

const DatasourceContext = createContext();

export const DatasourceProvider = ({ children }) => {
	const urlDatasourceId = useDatasourceId();
	const runId = useWorkflowRunId();

	const [datasourceId, setDatasourceId] = useState(urlDatasourceId);
	const [isCreating, setIsCreating] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [initError, setInitError] = useState('');
	const [hasInitAttempted, setHasInitAttempted] = useState(false);

	// Initialize datasource on mount if not present
	useEffect(() => {
		const initializeDatasource = async () => {
			// If we have a run_id, don't create a new datasource
			if (runId) {
				setInitError('');
				setIsReady(true);
				return;
			}

			// If we already have a datasource ID from URL, use it
			if (urlDatasourceId) {
				setDatasourceId(urlDatasourceId);
				setInitError('');
				setIsReady(true);
				return;
			}

			if (hasInitAttempted || isCreating) {
				return;
			}

			// Create new datasource if none exists
			if (!datasourceId) {
				try {
					setHasInitAttempted(true);
					setIsCreating(true);
					setInitError('');
					const res = await createEmptyDatasource({
						datasource_type: 'system_generated',
					});

					if (res?.datasource_id) {
						setDatasourceId(res.datasource_id);
						setUrlParam('datasource_id', res.datasource_id);
						setInitError('');
						setIsReady(true);
					}
				} catch (error) {
					console.error('Failed to create datasource:', error);
					const isPermissionError = error?.response?.status === 403;
					const errorMessage = isPermissionError
						? 'Your role does not have permission to connect data source.'
						: error?.response?.data?.message ||
							'Failed to initialize upload session';
					setInitError(errorMessage);
					// Mark error to suppress axios interceptor toast (we show custom one here)
					if (isPermissionError) {
						error._skipAxiosToast = true;
					}
					toast.error(errorMessage, {
						position: 'bottom-center',
					});
				} finally {
					setIsCreating(false);
				}
			}
		};

		initializeDatasource();
	}, [urlDatasourceId, runId, datasourceId, isCreating, hasInitAttempted]);

	// Sync with URL changes
	useEffect(() => {
		if (urlDatasourceId && urlDatasourceId !== datasourceId) {
			setDatasourceId(urlDatasourceId);
			setInitError('');
			setIsReady(true);
		}
	}, [urlDatasourceId, datasourceId]);

	// Function to update datasource ID (for when save returns a different ID)
	const updateDatasourceId = useCallback(
		(newId) => {
			if (newId && newId !== datasourceId) {
				setDatasourceId(newId);
				setUrlParam('datasource_id', newId);
			}
		},
		[datasourceId],
	);

	const contextValue = {
		datasourceId,
		updateDatasourceId,
		isCreating,
		isReady: isReady && !!datasourceId,
		hasRunId: !!runId,
		initError,
	};

	return (
		<DatasourceContext.Provider value={contextValue}>
			{children}
		</DatasourceContext.Provider>
	);
};

export const useStructuredDatasourceId = () => {
	const context = useContext(DatasourceContext);
	if (context === undefined) {
		throw new Error(
			'useStructuredDatasourceId must be used within a DatasourceProvider',
		);
	}
	return context;
};
