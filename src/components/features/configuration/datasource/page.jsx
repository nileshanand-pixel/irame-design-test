import React, { useEffect, useState } from 'react';
import DataCard from './DataCard';
import Glossary from './Glossary';
import { useRouter } from '@/hooks/useRouter';
import {
	deleteDataSource,
	getDataSourceById,
	updateDataSource,
} from '../service/configuration.service';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { queryClient } from '@/lib/react-query';
import DataSourceSkeleton from './DatasourceSkeleton';
import BackdropLoader from '@/components/elements/loading/BackDropLoader';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { areStringObjectsEqual } from '@/utils/common';
import useDatasourceDetails from '@/api/datasource/hooks/useDataSourceDetails';
import { getDatasourceDetailsQueryKey } from '@/api/datasource/datasource.query-key';

const tabs = [
	{ name: 'Data Card', component: DataCard },
	{ name: 'Glossary', component: Glossary },
];

const DataSource = () => {
	const { navigate, query } = useRouter();
	const [form, setForm] = useState(null);
	const [isNameEditing, setIsNameEditing] = useState(false);
	const [selectedTab, setSelectedTab] = useState(tabs[0].name);
	const [changesForTracking, setChangesForTracking] = useState([]);

	const datasourceQuery = useDatasourceDetails({
		datasourceId: query?.id,
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteDataSource(id),
		onSuccess: () => {
			toast.success('Data source deleted successfully');
			queryClient.invalidateQueries(['get-datasource-by-id', 'data-sources']);
			trackEvent(
				EVENTS_ENUM.DATASET_DELETION_SUCCESSFUL,
				EVENTS_REGISTRY.DATASET_DELETION_SUCCESSFUL,
				() => ({
					source: 'inside_dataset',
					dataset_id: datasourceQuery?.data?.datasource_id,
					dataset_name: datasourceQuery?.data?.name,
				}),
			);
			navigate('/app/configuration?source=configuration');
		},
		onError: (err) => {
			logError(err, {
				feature: 'configuration',
				action: 'delete-datasource',
				datasource_id: datasourceQuery?.data?.datasource_id,
			});
			trackEvent(
				EVENTS_ENUM.DATASET_DELETION_FAILED,
				EVENTS_REGISTRY.DATASET_DELETION_FAILED,
				() => ({
					source: 'inside_dataset',
					dataset_id: datasourceQuery?.data?.datasource_id,
					dataset_name: datasourceQuery?.data?.name,
					...getErrorAnalyticsProps(err),
				}),
			);
			logError(err, {
				feature: 'datasource',
				action: 'delete_datasource',
				extra: {
					datasource_id: datasourceQuery?.data?.datasource_id,
					dataset_name: datasourceQuery?.data?.name,
				},
			});
			toast.error('Something went wrong while deleting Data source');
		},
	});

	const editMutation = useMutation({
		mutationFn: ({ id, payload }) => updateDataSource(id, payload),
		onSuccess: () => {
			toast.success('Dataset updated successfully');
			// Invalidate and refetch to force fresh data
			queryClient.invalidateQueries(getDatasourceDetailsQueryKey(query?.id));
			const eventProperties = {
				dataset_id: datasourceQuery?.data?.datasource_id,
				dataset_name: datasourceQuery?.data?.name,
				changes: changesForTracking,
			};

			const oldDataSourceData = datasourceQuery?.data;

			if (changesForTracking.includes('name')) {
				eventProperties.old_name = oldDataSourceData?.name;
				eventProperties.new_name = form.name;
			}

			if (changesForTracking.includes('description')) {
				eventProperties.old_desc =
					oldDataSourceData?.processed_files?.description;
				eventProperties.new_desc = form?.processed_files?.description;
			}

			if (changesForTracking.includes('column_desc')) {
				const oldColumns =
					oldDataSourceData?.processed_files?.files?.flatMap((file) =>
						file.columns.map((col) => ({
							...col,
							file_name: file.file_name,
						})),
					) || [];
				const newColumns =
					form?.processed_files?.files?.flatMap((file) =>
						file.columns.map((col) => ({
							...col,
							file_name: file.file_name,
						})),
					) || [];
				const changedColumns = newColumns.filter((newCol, index) => {
					const oldCol = oldColumns[index];
					return !areStringObjectsEqual(newCol, oldCol);
				});
				eventProperties.changed_columns = changedColumns.map((col) => ({
					file_name: col.file_name,
					name: col.name,
					old_desc: oldColumns.find(
						(oldCol) =>
							oldCol.name === col.name &&
							oldCol.file_name === col.file_name,
					)?.description,
					new_desc: col.description,
				}));
			}

			const newGlossariesTerms = (
				form?.processed_files?.glossary?.items || []
			).map((glossary) => glossary.term);
			const oldGlossariesTerms = (
				oldDataSourceData?.processed_files?.glossary?.items || []
			).map((glossary) => glossary.term);

			eventProperties.old_glossary_terms = oldGlossariesTerms;
			eventProperties.new_glossary_terms = newGlossariesTerms;

			trackEvent(
				EVENTS_ENUM.DATASET_UPDATION_SUCCESSFUL,
				EVENTS_REGISTRY.DATASET_UPDATION_SUCCESSFUL,
				() => eventProperties,
			);
		},
		onError: (err) => {
			trackEvent(
				EVENTS_ENUM.DATASET_UPDATION_FAILED,
				EVENTS_REGISTRY.DATASET_UPDATION_FAILED,
				() => ({
					dataset_id: datasourceQuery?.data?.datasource_id,
					dataset_name: datasourceQuery?.data?.name,
					changes: changesForTracking,
					...getErrorAnalyticsProps(err),
				}),
			);
			// console.log('Error updating data source', err);
			logError(err, {
				feature: 'datasource',
				action: 'update_datasource',
				extra: {
					datasource_id: datasourceQuery?.data?.datasource_id,
					dataset_name: datasourceQuery?.data?.name,
					changes: changesForTracking,
				},
			});
			toast.error(
				'Something went wrong while updating Data source ' + err.message,
			);
		},
	});

	const addChangeForTracking = (change) => {
		setChangesForTracking((prev) => {
			if (prev.includes(change)) {
				return prev;
			} else {
				return [...prev, change];
			}
		});
	};

	const handleNameChange = (e) => {
		setForm({ ...form, name: e.target.value, hasChanges: true });
		trackEvent(
			EVENTS_ENUM.DATASET_NAME_UPDATED,
			EVENTS_REGISTRY.DATASET_NAME_UPDATED,
			() => ({
				dataset_id: datasourceQuery?.data?.datasource_id,
				dataset_name: datasourceQuery?.data?.name,
				old_name: form.name,
				new_name: e.target.value,
			}),
		);
		addChangeForTracking('name');
	};

	const handleEditClick = () => {
		setIsNameEditing(true);
	};

	const handleBlur = () => {
		setIsNameEditing(false);
	};

	const handleTabChange = (tabName) => {
		setSelectedTab(tabName);
	};

	const handleEditDataSource = () => {
		if (!query?.id) return;
		const payload = {
			processed_files: {
				glossary: form?.processed_files?.glossary,
				description: form?.processed_files?.description,
				files: form?.processed_files?.files?.map((item) => ({
					id: item.id,
					columns: item.columns,
				})),
			},
			name: form.name,
		};
		if (
			!confirm(
				'Are you sure you want to save these changes to your data source?',
			)
		)
			return;
		editMutation.mutateAsync({ id: query?.id, payload });
	};

	const handleDeleteDatasource = () => {
		if (!query?.id) return;
		if (!confirm('Are you sure you want to delete this data source?')) return;
		deleteMutation.mutateAsync(query.id);
	};

	const renderTabContent = () => {
		const TabComponent = tabs.find((tab) => tab.name === selectedTab)?.component;
		return TabComponent ? (
			<TabComponent
				form={form}
				setForm={setForm}
				data={datasourceQuery?.data}
				addChangeForTracking={addChangeForTracking}
			/>
		) : null;
	};

	const renderActionButtons = () => {
		return (
			<div className="flex gap-2 items-center">
				<div className="flex flex-row-reverse p-2 bg-primary4 hover:bg-primary8 rounded-md text-purple-80">
					<span
						onClick={handleDeleteDatasource}
						className="material-symbols-outlined cursor-pointer text-xl"
					>
						delete
					</span>
				</div>

				<Button
					variant="outlined"
					className="text-sm font-semibold text-purple-100 bg-purple-4 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
					onClick={() => {
						trackEvent(
							EVENTS_ENUM.DATASET_START_QUERING_CLICKED,
							EVENTS_REGISTRY.DATASET_START_QUERING_CLICKED,
							() => ({
								dataset_id: datasourceQuery?.data?.datasource_id,
								dataset_name: datasourceQuery?.data?.name,
							}),
						);
						navigate(
							`/app/new-chat/?step=3&dataSourceId=${query?.id}&source=configuration`,
						);
					}}
				>
					Start Querying
				</Button>
				<Button
					className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
					onClick={handleEditDataSource}
					disabled={!form.hasChanges}
				>
					Save Changes
				</Button>
			</div>
		);
	};

	useEffect(() => {
		if (datasourceQuery.isSuccess) {
			const fetchedData = datasourceQuery.data;
			if (
				!form ||
				form.name !== fetchedData.name ||
				JSON.stringify(form.processed_files) !==
					JSON.stringify(fetchedData.processed_files)
			) {
				setForm({
					processed_files: fetchedData.processed_files,
					name: fetchedData.name,
					hasChanges: false,
				});
			}
		}
	}, [datasourceQuery.isSuccess, datasourceQuery.data]);

	return (
		<div className="w-full px-8 relative h-full pt-2">
			{(editMutation.isPending || deleteMutation.isPending) && (
				<BackdropLoader />
			)}
			<div className="text-primary80 gap-2 mb-4">
				<span
					className="text-2xl font-semibold cursor-pointer"
					onClick={() =>
						navigate('/app/configuration?source=configuration')
					}
				>
					Configuration
				</span>
				<span className="text-sm font-medium">
					/ Manage Existing Dataset
				</span>
			</div>

			{/* Card section */}
			{datasourceQuery.isLoading || !form ? (
				<DataSourceSkeleton color="#E0E0E0" />
			) : (
				<div className="border rounded-3xl py-6 px-6 shadow-1xl h-[80vh]">
					{/* Header */}
					<div className="flex justify-between w-full">
						<div className="flex items-center text-[#26064ACC]">
							{isNameEditing ? (
								<input
									type="text"
									value={form.name}
									onChange={handleNameChange}
									onBlur={handleBlur}
									autoFocus
									className="outline-none bg-transparent border-b-2 border-gray-300"
								/>
							) : (
								<span className="text-xl font-semibold">
									{form.name}
								</span>
							)}
							<span
								className="ml-2 cursor-pointer text-xl font-semibold"
								onClick={handleEditClick}
							>
								<img
									src="https://d2vkmtgu2mxkyq.cloudfront.net/edit_icon.svg"
									className="size-6"
									style={{ strokeWidth: '4' }}
								></img>
							</span>
						</div>

						{renderActionButtons()}
					</div>

					{/* Tabs */}
					<div className="mt-2">
						<ul className="ghost-tabs relative col-span-12 mb-4 inline-flex w-full border-b border-black-10">
							{tabs.map((tab) => (
								<li
									key={tab.name}
									className={`!pb-1 flex items-center gap-2 ${selectedTab === tab.name ? 'active-tab' : 'default-tab'}`}
									onClick={() => handleTabChange(tab.name)}
								>
									{tab.name}
								</li>
							))}
						</ul>
					</div>

					{/* Tab Content */}
					<div className="mt-2 h-5/6">{renderTabContent()}</div>
				</div>
			)}
		</div>
	);
};

export default DataSource;
