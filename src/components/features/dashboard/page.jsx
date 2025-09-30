import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createDashboard, getUserDashboard } from './service/dashboard.service';
import { logError } from '@/lib/logger';
import DashboardCard from './components/DashboardCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/hooks/useRouter';
import CreateDashboardDialog from './components/CreateDashboardDialog';
import { toast } from '@/lib/toast';
import EmptyState from '@/components/elements/EmptyState';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';
import { queryClient } from '@/lib/react-query';

const Dashboard = () => {
	const [dashboard, setDashboard] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [search, setSearch] = useState('');
	const [showCreateDashboard, setShowCreateDashboard] = useState(false);
	const [dashboardName, setDashboardName] = useState('');
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [refetch, setRefetch] = useState(false);

	const { navigate, query } = useRouter();

	const userDashboardQuery = useQuery({
		queryKey: ['user-dashboard'],
		queryFn: () => getUserDashboard(),
		onError: (error) => {
			logError(error, {
				feature: 'dashboard',
				action: 'fetchUserDashboard',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
				},
			});
		},
	});

	const handleCreateNewDashboard = async () => {
		try {
			if (!dashboardName) {
				setErrors({ dashboardName: 'Please enter dashboard name' });
				return;
			}
			setIsLoading(true);
			const resp = await createDashboard(dashboardName);
			if (resp) {
				setIsLoading(false);
				setShowCreateDashboard(false);
				toast.success('Dashboard created successfully');
				trackEvent(
					EVENTS_ENUM.DASHBOARD_NEW_CREATED,
					EVENTS_REGISTRY.DASHBOARD_NEW_CREATED,
					() => ({
						dashboard_id: resp.dashboard_id,
						dashboard_name: dashboardName,
					}),
				);
				queryClient.invalidateQueries(['user-dashboard']);
				navigate(`/app/new-chat?source=dashboard`);
			}
		} catch (error) {
			setIsLoading(false);
			logError(error, {
				feature: 'dashboard',
				action: 'create-dashboard',
			});
			toast.error('Something went wrong while creating dashboard');
		}
	};

	const filteredList = useMemo(() => {
		if (search) {
			trackEvent(
				EVENTS_ENUM.DASHBOARD_SEARCHED,
				EVENTS_REGISTRY.DASHBOARD_SEARCHED,
				() => ({
					search_query: search,
				}),
			);
		}
		return dashboard.filter((item) =>
			item?.title?.toLowerCase()?.includes(search?.trim()?.toLowerCase()),
		);
	}, [search, dashboard]);

	useEffect(() => {
		if (userDashboardQuery.data) {
			setDashboard(userDashboardQuery.data || []);
		}
	}, [refetch, userDashboardQuery.data]);

	useEffect(() => {
		setErrors({});
	}, [dashboardName]);

	const emptyStateConfig = {
		image: 'https://d2vkmtgu2mxkyq.cloudfront.net/empty-state.svg',
		reactionText: 'Create your first dashboard...',
		ctaText: 'Create a Dashboard',
		ctaDisabled: false,
		ctaClickHandler: () => setShowCreateDashboard(true),
	};

	useEffect(() => {
		trackEvent(
			EVENTS_ENUM.DASHBOARD_HOMEPAGE_LOADED,
			EVENTS_REGISTRY.DASHBOARD_HOMEPAGE_LOADED,
			() => ({
				source: query.source || 'url',
			}),
		);
	}, [query]);

	return (
		<div className="w-full ml-8 h-full flex flex-col overflow-hidden">
			<div className="w-full flex justify-between mt-2 ">
				<h2 className="text-2xl font-semibold text-primary80 ">Dashboard</h2>
				<div className="flex items-center gap-4">
					<div
						className={cn(
							'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
							{
								'w-[18.75rem]': isFocused,
								'w-[7.375rem]': !isFocused,
							},
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
						className="w-fit mr-9 rounded-lg bg-purple-8 hover:bg-purple-16 text-purple-100 font-medium"
						onClick={() => {
							trackEvent(
								EVENTS_ENUM.DASHBOARD_CREATE_NEW_CLICKED,
								EVENTS_REGISTRY.DASHBOARD_CREATE_NEW_CLICKED,
							);
							setShowCreateDashboard(true);
						}}
					>
						Create a Dashboard
					</Button>
				</div>
			</div>
			<div className="mt-6 pr-8 flex-1 overflow-y-auto">
				{userDashboardQuery.isLoading ? (
					<div className="w-full mt-6 p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
						<div className="flex items-center space-x-4">
							<Skeleton className="h-12 w-16 rounded-xl bg-purple-4" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-[15.625rem] bg-purple-4" />
								<Skeleton className="h-4 w-[12.5rem] bg-purple-4" />
							</div>
						</div>
					</div>
				) : dashboard.length === 0 ? (
					<EmptyState config={emptyStateConfig} />
				) : filteredList.length > 0 ? (
					<div className="w-full mt-2 bg-white border border-primary10 rounded-s-xl rounded-e-xl mb-6">
						{filteredList.map((item, idx) => (
							<DashboardCard
								key={idx}
								data={item}
								refetch={refetch}
								setRefetch={setRefetch}
							/>
						))}
					</div>
				) : (
					<div className="w-full mt-6 p-6  bg-white border border-primary1 rounded-s-xl rounded-e-xl">
						<p className="text-sm text-primary60 font-medium">
							{search
								? 'No such dashboard found'
								: 'No dashboards found'}
						</p>
					</div>
				)}
			</div>

			{showCreateDashboard && (
				<CreateDashboardDialog
					open={showCreateDashboard}
					setOpen={setShowCreateDashboard}
					dashboardName={dashboardName}
					setDashboardName={setDashboardName}
					handleCreateNewDashboard={handleCreateNewDashboard}
					errors={errors}
					isLoading={isLoading}
				/>
			)}
		</div>
	);
};

export default Dashboard;
