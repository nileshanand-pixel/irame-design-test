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

	// Initialize datasource on mount if not present
	useEffect(() => {
		const initializeDatasource = async () => {
			// If we have a run_id, don't create a new datasource
			if (runId) {
				setIsReady(true);
				return;
			}

			// If we already have a datasource ID from URL, use it
			if (urlDatasourceId) {
				setDatasourceId(urlDatasourceId);
				setIsReady(true);
				return;
			}

			// Create new datasource if none exists
			if (!datasourceId && !isCreating) {
				try {
					setIsCreating(true);
					const res = await createEmptyDatasource({
						datasource_type: 'system_generated',
					});

					if (res?.datasource_id) {
						setDatasourceId(res.datasource_id);
						setUrlParam('datasource_id', res.datasource_id);
						setIsReady(true);
					}
				} catch (error) {
					console.error('Failed to create datasource:', error);
					toast.error('Failed to initialize upload session');
				} finally {
					setIsCreating(false);
				}
			}
		};

		initializeDatasource();
	}, [urlDatasourceId, runId, datasourceId, isCreating]);

	// Sync with URL changes
	useEffect(() => {
		if (urlDatasourceId && urlDatasourceId !== datasourceId) {
			setDatasourceId(urlDatasourceId);
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
