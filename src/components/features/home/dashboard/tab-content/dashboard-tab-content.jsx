import dashboardActiveIcon from '@/assets/icons/dashboard-active.svg';
import CustomCarousel from '@/components/elements/custom-carousel';
import Card from '../../workflow-library/card';
import {
	createDashboard,
	getUserDashboardsForDashboard,
} from '@/components/features/dashboard/service/dashboard.service';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import CreateDashboardDialog from '@/components/features/dashboard/components/CreateDashboardDialog';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import { logError } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const formatDate = (dateString) => {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.toLocaleDateString('en-US', { month: 'short' });
	const year = date.getFullYear();
	return `${day} ${month} ${year}`;
};

export default function DashboardsTabContent({ dateRange }) {
	const [showCreateDashboard, setShowCreateDashboard] = useState(false);
	const [dashboardName, setDashboardName] = useState('');
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	const navigate = useNavigate();

	const {
		data,
		isLoading: isLoadingDashboards,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['dashboards', dateRange],
		queryFn: getUserDashboardsForDashboard,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			// Return the next cursor if there's more data, otherwise undefined
			return lastPage?.cursor ? lastPage?.cursor : undefined;
		},
		enabled: !!dateRange?.startDate && !!dateRange?.endDate,
	});

	// Flatten all pages into a single array of dashboards
	const dashboardsData =
		data?.pages?.flatMap((page) => page?.dashboard_list) || [];

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
				queryClient.invalidateQueries({
					queryKey: ['dashboards', dateRange],
				});
				navigate(`/app/dashboard`);
			}
		} catch (error) {
			setIsLoading(false);
			logError(error, {
				feature: 'homepage',
				action: 'create-dashboard-in-homepage',
			});

			// Check for duplicate key error
			if (error.response?.data?.error_code === 'duplicate_key') {
				const errorMessage =
					error.response?.data?.message ||
					'A dashboard with this name already exists';
				setErrors({ dashboardName: errorMessage });
				toast.error(errorMessage);
			} else {
				toast.error('Something went wrong while creating dashboard');
			}
		}
	};

	return (
		<div className="py-4 pt-5 px-6 bg-[#6A12CD05] rounded-2xl border border-[#00000014]">
			<div className="mb-5">
				<div className="flex items-center gap-2">
					<span className="text-[#000000CC] font-semibold">
						Recent Dashboards Created
					</span>
					{/* <span className="text-[#344054] text-[0.75rem] font-medium">
						Latest Reports Updates: 6
					</span> */}
				</div>
			</div>

			{isLoadingDashboards ? (
				<div className="flex items-center gap-3 h-[13.90rem]">
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
				</div>
			) : dashboardsData?.length > 0 ? (
				<CustomCarousel
					items={dashboardsData}
					isLoading={isLoadingDashboards}
					isFetchingNextPage={isFetchingNextPage}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					renderItem={(item) => (
						<Card
							icon={dashboardActiveIcon}
							description={item.title}
							badges={[formatDate(item.created_at)]}
							descriptionLines={3}
							onClickHandler={() => {
								navigate(
									`/app/dashboard/content?id=${item.dashboard_id}&name=${item.title}`,
								);
							}}
						/>
					)}
				/>
			) : (
				<div className="pb-8 flex flex-col gap-4 items-center">
					<div className="p-4 rounded-full bg-[#F2E8FA]">
						<img src={dashboardActiveIcon} className="size-5" />
					</div>

					<div className="text-xl font-semibold text-[#26064A]">
						Create your first Dashboard
					</div>

					<div className="text-sm text-[#26064ACC]">
						Bring your data to life with a custom view
					</div>

					<Button onClick={() => setShowCreateDashboard(true)}>
						Create
					</Button>
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
}
