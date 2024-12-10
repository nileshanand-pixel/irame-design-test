import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getToken } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getReports } from './service/reports.service';
import ReportCard from './components/ReportCard';
import CardSkeleton from './components/CardSkeletion';
import EmptyState from '@/components/elements/EmptyState';

const Reports = () => {
	const [reports, setReports] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [search, setSearch] = useState('');

	const reportsQuery = useQuery({
		queryKey: ['get-reports'],
		queryFn: () => getReports(getToken()),
		refetchInterval: 10000,
	});

	const filteredList = useMemo(() => {
		return reports.filter(
			(item) =>
				item?.name?.toLowerCase()?.startsWith(search?.trim()?.toLowerCase()) ||
				item?.datasource_name
					?.toLowerCase()
					?.startsWith(search?.trim()?.toLowerCase()),
		);
	}, [search, reports]);

	useEffect(() => {
		if (reportsQuery.data) {
			setReports(reportsQuery.data || []);
		}
	}, [reportsQuery.data]);

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
		<div className="w-full h-full ">
			<div className="w-full flex justify-between mt-2 ">
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
						disabled={true}
					>
						Create Report
					</Button>
				</div>
			</div>

			{reportsQuery.isLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
					<CardSkeleton />
					<CardSkeleton />
					<CardSkeleton />
				</div>
			) : reports.length === 0 ? (
				<EmptyState config={emptyStateConfig} />
			) : filteredList.length > 0 ? (
				<div className="w-full mt-6 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
	);
};

export default Reports;
