import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getToken } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
	getDatasources,
	getSharedReports,
	getUserReports,
} from './service/reports.service';
import EmptyState from '@/components/elements/EmptyState';
import DataSourceCard from './components/DataSourceCard';
import DataSourceCardSkeleton from './components/DatasourceCardSkeleton';
import { useDispatch } from 'react-redux';
import { openModal } from '@/redux/reducer/modalReducer';

const ReportFolders = () => {
	const [datasources, setDatasources] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [search, setSearch] = useState('');
	const dispatch = useDispatch();

	const datasourcesQuery = useQuery({
		queryKey: ['get-datasources-reports'],
		queryFn: () => getDatasources(getToken()),
		refetchInterval: 10000,
	});

	const sharedReportsQuery = useQuery({
		queryKey: ['get-shared-reports', getToken()],
		queryFn: () => getSharedReports(getToken()),
		refetchInterval: 600000,
	});

	const userAuditReports = useQuery({
		queryKey: ['user-reports', getToken()],
		queryFn: () => getUserReports(getToken()),
		refetchInterval: 600000,
	});

	const filteredList = useMemo(() => {
		return datasources.filter((item) =>
			item?.datasource_name
				?.toLowerCase()
				?.startsWith(search?.trim()?.toLowerCase()),
		);
	}, [search, datasources]);

	useEffect(() => {
		const auditReports = userAuditReports?.data?.reports || [];
		const sharedReports = sharedReportsQuery?.data?.reports || [];
		let updatedDatasources = datasourcesQuery?.data?.datasources || [];

		const folders = [];

		if (auditReports?.length > 0) {
			folders.push({
				datasource_id: 'audit',
				datasource_name: 'Audit Reports',
				report_count: auditReports.length,
				reports: auditReports,
			});
		}

		if (sharedReports?.length > 0) {
			folders.push({
				datasource_id: 'shared',
				datasource_name: 'Shared',
				report_count: sharedReports.length,
				reports: sharedReports,
			});
		}

		// Add the rest of the datasources
		folders.push(...updatedDatasources);

		setDatasources(folders);
	}, [datasourcesQuery.data, sharedReportsQuery.data, userAuditReports.data]);

	const emptyStateConfig = {
		image: 'https://d2vkmtgu2mxkyq.cloudfront.net/empty-state.svg',
		actionText: 'Create your first report by adding a new data source,',
		reactionText: 'your report will be auto generated...',
		ctaText: 'Create a Report',
		ctaDisabled: true,
		ctaClickHandler: () => {},
		comingSoonText: 'Custom report feature coming soon...',
	};

	return (
		<div className="w-full ml-8  h-full flex flex-col overflow-hidden">
			<div className="flex-none w-full flex pr-8 justify-between mt-2 ">
				<h2 className="text-2xl font-semibold text-primary80 ">Reports</h2>
				<div className="flex items-center gap-4">
					<div
						className={cn(
							'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
							{ 'w-[300px]': isFocused, 'w-[118px]': !isFocused },
						)}
					>
						<i className="bi-search text-primary40 me-2"></i>
						<Input
							placeholder="Search"
							className={cn(
								'border-none rounded-sm px-0 text-primary40 font-medium bg-transparent',
							)}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
						/>
					</div>
					<Button
						variant="secondary"
						className="w-fit rounded-lg bg-purple-8 hover:bg-purple-16 text-purple-100 font-medium"
						disabled={false}
						onClick={() => dispatch(openModal('createReport'))}
					>
						Create Report
					</Button>
				</div>
			</div>

			<div className="mt-6 pr-8 flex-1 overflow-y-auto">
				{datasourcesQuery.isLoading ? (
					<div className=" w-full grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-2 pb-6">
						{Array.from({ length: 16 }).map((_, i) => (
							<DataSourceCardSkeleton key={i} />
						))}
					</div>
				) : datasources.length === 0 ? (
					<EmptyState config={emptyStateConfig} />
				) : filteredList.length > 0 ? (
					<div className="w-full overflow-y-auto mt-2 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
						{filteredList.map((item) => (
							<DataSourceCard key={item.datasource_id} data={item} />
						))}
					</div>
				) : (
					<div className="w-full mt-6 p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
						<p className="text-sm text-primary60 font-medium">
							No such Datasource found
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReportFolders;
