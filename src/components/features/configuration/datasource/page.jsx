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
import { getToken } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { queryClient } from '@/lib/react-query';
import DataSourceSkeleton from './DatasourceSkeleton';
import BackdropLoader from '@/components/elements/loading/BackDropLoader';

const tabs = [
	{ name: 'Data Card', component: DataCard },
	// { name: 'Glossary', component: Glossary },
];

const DataSource = () => {
	const { navigate, query } = useRouter();
	const [form, setForm] = useState(null);
	const [isNameEditing, setIsNameEditing] = useState(false);
	const [selectedTab, setSelectedTab] = useState(tabs[0].name);

	const datasourceQuery = useQuery({
		queryKey: ['get-datasource-by-id', query?.id],
		queryFn: () => getDataSourceById(getToken(), query?.id),
		enabled: !!query?.id,
	});

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteDataSource(id, getToken()),
		onSuccess: () => {
			toast.success('Data source deleted successfully');
			queryClient.invalidateQueries(['get-datasource-by-id', 'data-sources']);
			navigate('/app/configuration');
		},
		onError: (err) => {
			console.log('Error deleting data source', err);
			toast.error('Something went wrong while deleting Data source');
		},
	});

	const editMutation = useMutation({
		mutationFn: ({ id, payload }) => updateDataSource(id, payload, getToken()),
		onSuccess: () => {
			toast.success('Dataset updated successfully');
			// Invalidate and refetch to force fresh data
			queryClient.invalidateQueries(['get-datasource-by-id', query?.id]);
		},
		onError: (err) => {
			console.log('Error updating data source', err);
			toast.error(
				'Something went wrong while updating Data source ' + err.message,
			);
		},
	});
	

	const handleNameChange = (e) => {
		setForm({ ...form, name: e.target.value, hasChanges: true });
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
		if (!confirm('Are you sure you want to save these changes to your data source?'))return;
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
			/>
		) : null;
	};

	const renderActionButtons = () => {
		return (
			<div className="flex gap-2 items-center">
				<div className="flex flex-row-reverse p-2 bg-primary4 hover:bg-primary8 rounded-md text-purple-80">
					<span
						onClick={handleDeleteDatasource}
						className="material-symbols-outlined cursor-pointer"
					>
						delete
					</span>
				</div>

				<Button
					variant="outlined"
					className="text-sm font-semibold text-purple-100 bg-purple-4 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
					onClick={() => {
						navigate(`/app/new-chat/?step=3&dataSourceId=${query?.id}`);
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
				JSON.stringify(form.processed_files) !== JSON.stringify(fetchedData.processed_files)
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
		<div className="w-full relative h-[85vh] sm:h-[80vh] grid grid-cols-1 pt-8">

			{(editMutation.isPending || deleteMutation.isPending) && <BackdropLoader/>}
			<div className="text-primary80 gap-2">
				<span
					className="text-2xl font-semibold cursor-pointer"
					onClick={() => navigate('/app/configuration')}
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
				<div className="border rounded-3xl mt-6 py-6 px-6 col-span-12 shadow-1xl h-[80vh]">
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
					<div className="mt-6">
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
					<div className="mt-2 h-3/4 sm:h-5/6">{renderTabContent()}</div>
				</div>
			)}
		</div>
	);
};

export default DataSource;
