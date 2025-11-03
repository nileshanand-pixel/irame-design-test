import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
	getDatasourcesByReports,
	getSharedReports,
	getUserReports,
} from './service/reports.service';
import EmptyState from '@/components/elements/EmptyState';
import { logError } from '@/lib/logger';
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
		queryFn: () => getDatasourcesByReports(),
		refetchInterval: 10000,
	});

	const sharedReportsQuery = useQuery({
		queryKey: ['get-shared-reports'],
		queryFn: () => getSharedReports(),
		refetchInterval: 600000,
	});

	const userAuditReports = useQuery({
		queryKey: ['user-reports'],
		queryFn: () => getUserReports(),
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

	// Handle datasources query errors
	useEffect(() => {
		if (datasourcesQuery.error) {
			logError(datasourcesQuery.error, {
				feature: 'reports',
				action: 'fetchDatasources',
				extra: {
					errorMessage: datasourcesQuery.error.message,
					status: datasourcesQuery.error.response?.status,
				},
			});
		}
	}, [datasourcesQuery.error]);

	// Handle shared reports query errors
	useEffect(() => {
		if (sharedReportsQuery.error) {
			logError(sharedReportsQuery.error, {
				feature: 'reports',
				action: 'fetchSharedReports',
				extra: {
					errorMessage: sharedReportsQuery.error.message,
					status: sharedReportsQuery.error.response?.status,
				},
			});
		}
	}, [sharedReportsQuery.error]);

	// Handle user audit reports query errors
	useEffect(() => {
		if (userAuditReports.error) {
			logError(userAuditReports.error, {
				feature: 'reports',
				action: 'fetchUserReports',
				extra: {
					errorMessage: userAuditReports.error.message,
					status: userAuditReports.error.response?.status,
				},
			});
		}
	}, [userAuditReports.error]);

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
		<div className="w-full px-8 h-full flex flex-col gap-6 overflow-hidden">
			<div className="flex-none flex justify-between mt-2">
				<h2 className="text-2xl font-semibold text-primary80">Reports</h2>
				<div className="flex items-center gap-4">
					<div
						className={cn(
							'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
							{ 'w-[18.75rem]': isFocused, 'w-[7.375]': !isFocused },
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
						onClick={() =>
							dispatch(
								openModal({
									modalName: 'createReport',
									revalidateQuery: ['user-reports'],
								}),
							)
						}
					>
						Create Report
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{datasourcesQuery.isLoading ? (
					<div className="w-full grid grid-cols-3 gap-6 mt-2 pb-6">
						{Array.from({ length: 16 }).map((_, i) => (
							<DataSourceCardSkeleton key={i} />
						))}
					</div>
				) : datasources.length === 0 ? (
					<EmptyState config={emptyStateConfig} />
				) : filteredList.length > 0 ? (
					<div className="overflow-y-auto mt-2 bg-white grid grid-cols-3 gap-6 pb-6">
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
