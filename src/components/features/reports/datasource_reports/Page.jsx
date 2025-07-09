import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getDatasourceReports, getSharedReports, getUserReports } from '../service/reports.service';
import ReportCardSkeleton from '../components/ReportCardSkeleton';
import ReportCard from '../components/ReportCard';
import { useRouter } from '@/hooks/useRouter';
import EmptyState from '@/components/elements/EmptyState';
import { getDataSourceById } from '../../configuration/service/configuration.service';
import { Skeleton } from '@/components/ui/skeleton';
import { useDispatch } from 'react-redux';
import { openModal } from '@/redux/reducer/modalReducer';

const ReportsInDatasource = () => {
	const { query, navigate } = useRouter();
	const [reports, setReports] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [search, setSearch] = useState('');
	const dispatch = useDispatch();

	const reportsQuery = useQuery({
		queryKey: ['get-reports-by-datasource', query.datasourceId],
		queryFn: () => getDatasourceReports(query.datasourceId),
		refetchInterval: 10000,
		enabled: !!(query.datasourceId && query.datasourceId !== 'shared' && query.datasourceId !== 'audit'),
	});

	const sharedReportsQuery = useQuery({
		queryKey: ['get-shared-reports'],
		queryFn: () => getSharedReports(),
		refetchInterval: 600000,
		enabled: !!(query.datasourceId && query.datasourceId === 'shared'),
	});

	const userAuditReports = useQuery({
		queryKey: ['user-reports'],
		queryFn: () => getUserReports(),
		enabled: !!(query.datasourceId && query.datasourceId === 'audit'),
	})

	const datasourceQuery = useQuery({
		queryKey: ['get-datasource', query.datasourceId],
		queryFn: () => getDataSourceById(query.datasourceId),
		refetchInterval: 10000,
		enabled: !!(query.datasourceId && query.datasourceId !== 'shared' && query.datasourceId !== 'audit'),
	});

	const filteredList = useMemo(() => {
		const d = reports.filter((item) =>
			item?.name?.toLowerCase()?.startsWith(search?.trim()?.toLowerCase()),
		);
		return d;
	}, [search, reports]);

	useEffect(() => {
		if (query.datasourceId !== 'shared' && reportsQuery?.data?.reports) {
			setReports(reportsQuery?.data?.reports || []);
		}
	}, [reportsQuery.data]);

	useEffect(() => {
		if (query.datasourceId === 'shared' && sharedReportsQuery?.data?.reports) {
			setReports(sharedReportsQuery?.data?.reports || []);
		}
	}, [sharedReportsQuery.data]);

	useEffect(() => {
		if (query.datasourceId === 'audit' && userAuditReports?.data?.reports) {
			setReports(userAuditReports?.data?.reports || []);
		}
	}, [userAuditReports.data]);

	const emptyStateConfig = {
		image: 'https://d2vkmtgu2mxkyq.cloudfront.net/empty-state.svg',
		actionText: 'Create your first report by adding a new data source,',
		reactionText: 'your report will be auto generated...',
		ctaText: 'Create a Report',
		ctaDisabled: true,
		ctaClickHandler: () => { },
		comingSoonText: 'Custom report feature coming soon...',
	};

	return (
		<div className="flex flex-col w-full h-full ">
			<div className="w-full px-8 flex flex-none justify-between mt-2 ">
				<div className=" flex items-end text-primary80 gap-2">
					<div
						className="text-2xl font-semibold cursor-pointer"
						onClick={() => {
							navigate('/app/reports/datasources');
						}}
					>
						Reports /
					</div>
					{datasourceQuery.isLoading && (
						<Skeleton className="w-20 h-6 bg-purple-8" />
					)}
					{datasourceQuery?.data?.name && (
						<div className="pb-1 text-sm font-medium align-bottom">
							{datasourceQuery?.data?.name}
						</div>
					)}
					{query.datasourceId === 'shared' && (
						<div className="pb-1 text-sm font-medium align-bottom">
							Shared
						</div>
					)}
					{query.datasourceId === 'audit' && (
						<div className="pb-1 text-sm font-medium align-bottom">
							Audit Reports
						</div>
					)}
				</div>
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

			<div className="flex-1 px-8 overflow-y-auto">
				{reportsQuery.isLoading ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6 pb-6">
						{Array.from({ length: 16 }).map((i) => (
							<ReportCardSkeleton key={i} />
						))}
					</div>
				) : reports.length === 0 ? (
					<EmptyState config={emptyStateConfig} />
				) : filteredList.length > 0 ? (
					<div className="w-full mt-6 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-6  gap-6">
						{filteredList.map((item) => (
							<ReportCard key={item.report_id} report={item} />
						))}
					</div>
				) : (
					<div className="w-full mt-6 p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
						<p className="text-sm text-primary60 font-medium">
							No such Report found
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReportsInDatasource;
