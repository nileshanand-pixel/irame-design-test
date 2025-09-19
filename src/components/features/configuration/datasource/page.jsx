import React, { useEffect, useState } from 'react';
import DataCard from './DataCard';
import Glossary from './Glossary';
import { useRouter } from '@/hooks/useRouter';
import {
	deleteDataSource,
	updateDataSource,
} from '../service/configuration.service';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import DataSourceSkeleton from './DatasourceSkeleton';
import BackdropLoader from '@/components/elements/loading/BackDropLoader';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { areStringObjectsEqual } from '@/utils/common';
import { getDatasourceDetailsQueryKey } from '@/api/datasource/datasource.query-key';
import { FileText } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { DownloadSimple } from '@phosphor-icons/react';
import useS3File from '@/hooks/useS3File';

const tabs = [
	{ name: 'Data Card', component: DataCard },
	{ name: 'Glossary', component: Glossary },
];

const DataSource = () => {
	const [isEditing, setIsEditing] = useState(false);
	const { navigate, query } = useRouter();
	const [form, setForm] = useState(null);
	const [selectedTab, setSelectedTab] = useState(tabs[0].name);
	const [changesForTracking, setChangesForTracking] = useState([]);

	const { isDownloading, downloadS3File } = useS3File();

	const datasourceQuery = useDatasourceDetailsV2({
		datasourceId: query?.id,
		queryOptions: {
			refetchInterval: (data) => {
				if (data?.state?.data?.status === 'processing') {
					return 2000;
				}
				return false;
			},
		},
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
			console.error('Error deleting data source', err);
			toast.error('Something went wrong while deleting Data source');
		},
	});

	const editMutation = useMutation({
		mutationFn: ({ id, payload }) => updateDataSource(id, payload),
		onSuccess: () => {
			setIsEditing(false);
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
				eventProperties.old_desc = oldDataSourceData?.description;
				eventProperties.new_desc = form?.description;
			}

			if (changesForTracking.includes('column_desc')) {
				const oldColumns =
					oldDataSourceData?.files?.flatMap((file) =>
						file.columns.map((col) => ({
							...col,
							file_name: file.filename,
						})),
					) || [];
				const newColumns =
					form?.files?.flatMap((file) =>
						file.columns.map((col) => ({
							...col,
							file_name: file.filename,
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

			const newGlossariesTerms = (form?.glossary?.items || []).map(
				(glossary) => glossary.term,
			);
			const oldGlossariesTerms = (
				oldDataSourceData?.glossary?.items || []
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

	const handleTabChange = (tabName) => {
		setSelectedTab(tabName);
	};

	const handleEditDataSource = () => {
		if (!query?.id) return;
		const payload = {
			...form,
		};
		delete payload.hasChanges;
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
				isEditing={isEditing}
			/>
		) : null;
	};

	const handleDownloadDatasource = () => {
		datasourceQuery?.data?.files?.forEach((file) => {
			const fileUrl = file.processed_url || file.url;
			const downloadName = file.filename;

			if (fileUrl) {
				downloadS3File(fileUrl, downloadName);
				toast.success('Your files has been added to download!');
			}
		});
	};

	const renderActionButtons = () => {
		return (
			<div className="flex gap-2 items-center">
				{/* <Button
					variant="outline"
					className="p-2"
					onClick={() => {
						handleDownloadDatasource();
					}}
				>
					{isDownloading ? (
						<CircularLoader className="size-[1.125rem]" />
					) : (
						<DownloadSimple className="size-5" />
					)}
				</Button> */}
				<Button
					variant="secondary1"
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

				<DropdownMenu>
					<DropdownMenuTrigger>
						<i className="bi-three-dots-vertical text-primary40 text-xl font-bold cursor-pointer hover:bg-purple-4 rounded-md p-1"></i>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							className="text-primary80 font-medium hover:!bg-purple-4"
							onClick={() => {
								setIsEditing(true);
							}}
							disabled={
								isEditing ||
								datasourceQuery?.data?.status === 'processing'
							}
						>
							<i className="bi-pencil me-2 text-primary80 font-medium"></i>
							Edit
						</DropdownMenuItem>

						<DropdownMenuItem
							className="text-primary80 font-medium hover:!bg-purple-4"
							onClick={handleDeleteDatasource}
						>
							<i className="bi-trash me-2 text-primary80 font-medium"></i>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		);
	};

	useEffect(() => {
		if (datasourceQuery.isSuccess) {
			const fetchedData = datasourceQuery.data;
			if (
				!form ||
				form.name !== fetchedData.name ||
				form.description !== fetchedData?.description ||
				JSON.stringify(form.files) !== JSON.stringify(fetchedData?.files) ||
				JSON.stringify(form.glossary) !==
					JSON.stringify(fetchedData?.glossary)
			) {
				setForm({
					files: fetchedData?.files,
					glossary: fetchedData?.glossary,
					name: fetchedData.name,
					description: fetchedData?.description,
					hasChanges: false,
				});
			}
		}
	}, [datasourceQuery.isSuccess, datasourceQuery.data]);

	return (
		<div className="flex flex-col w-full px-8 relative h-full pt-2">
			{(editMutation.isPending || deleteMutation.isPending) && (
				<BackdropLoader />
			)}

			<div className="text-primary80 gap-2 mb-4 shrink-0">
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
				<div className="border rounded-3xl py-6 px-6 shadow-1xl h-[89vh] ">
					{/* Header */}
					<div className="flex justify-between w-full">
						<div className="flex items-center gap-2 text-[#26064ACC]">
							<FileText className="size-6" />
							{isEditing ? (
								<input
									type="text"
									value={form.name}
									onChange={handleNameChange}
									autoFocus
									className="outline-none bg-transparent border-b-2 border-gray-300"
								/>
							) : (
								<span className="text-xl font-semibold">
									{form.name}
								</span>
							)}
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
