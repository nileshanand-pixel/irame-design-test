import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getToken } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createDashboard, getUserDashboard } from './service/dashboard.service';
import DashboardCard from './components/DashboardCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/hooks/useRouter';
import CreateDashboardDialog from './components/CreateDashboardDialog';
import { toast } from 'sonner';
import EmptyState from '@/components/elements/EmptyState';

const Dashboard = () => {
	const [dashboard, setDashboard] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [search, setSearch] = useState('');
	const [showCreateDashboard, setShowCreateDashboard] = useState(false);
	const [dashboardName, setDashboardName] = useState('');
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [refetch, setRefetch] = useState(false);

	const { navigate } = useRouter();

	const userDashboardQuery = useQuery({
		queryKey: 'user-dashboard',
		queryFn: () => getUserDashboard(getToken()),
	});

	const handleCreateNewDashboard = async () => {
		try {
			if (!dashboardName) {
				setErrors({ dashboardName: 'Please enter dashboard name' });
				return;
			}
			setIsLoading(true);
			const resp = await createDashboard(getToken(), dashboardName);
			if (resp) {
				setIsLoading(false);
				setShowCreateDashboard(false);
				toast.success('Dashboard created successfully');
				navigate(`/app/new-chat`);
			}
		} catch (error) {
			setIsLoading(false);
			console.log('dashboard create error', error);
			toast.error('Something went wrong while creating dashboard');
		}
	};

	const filteredList = useMemo(() => {
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

	return (
		<div className="w-full h-full ">
			<div className="w-full flex justify-between mt-2 ">
				<h2 className="text-2xl font-semibold text-primary80 ">Dashboard</h2>
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
						onClick={() => setShowCreateDashboard(true)}
					>
						Create a Dashboard
					</Button>
				</div>
			</div>

			{userDashboardQuery.isLoading ? (
				<div className="w-full mt-6 p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
					<div className="flex items-center space-x-4">
						<Skeleton className="h-12 w-16 rounded-xl bg-purple-4" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-[250px] bg-purple-4" />
							<Skeleton className="h-4 w-[200px] bg-purple-4" />
						</div>
					</div>
				</div>
			) : dashboard.length === 0 ? (
				<EmptyState config={emptyStateConfig} />
			) : filteredList.length > 0 ? (
				<div className="w-full mt-6 bg-white border border-primary10 rounded-s-xl rounded-e-xl">
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
				<div className="w-full mt-6 p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
					<p className="text-sm text-primary60 font-medium">
						{search ? 'No such dashboard found' : 'No dashboards found'}
					</p>
				</div>
			)}

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
