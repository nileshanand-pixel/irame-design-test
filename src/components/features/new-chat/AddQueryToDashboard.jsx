import React, { useEffect, useState } from 'react';
import InputText from '@/components/elements/InputText';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogDescription,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	createDashboard,
	createDashboardContent,
	getUserDashboard,
} from '../dashboard/service/dashboard.service';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/hooks/useRouter';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import graphPlaceholder from '@/assets/icons/graph-placeholder.svg';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

const AddQueryToDashboard = ({ open, setDashboard, newDashboardIds }) => {
	const [dashboards, setDashboards] = useState([]);
	const [search, setSearch] = useState('');
	const [selectedDashboard, setSelectedDashboard] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const { query, navigate } = useRouter();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const utilReducer = useSelector((state) => state.utilReducer);

	const userDashboardQuery = useQuery({
		queryKey: ['user-dashboard'],
		queryFn: () => getUserDashboard(),
	});

	const { data: datasourceData } = useDatasourceDetailsV2();

	const handleAddQueryToDashboard = () => {
		setIsLoading(true);
		createDashboardContent(selectedDashboard.dashboard_id, {
			query_id: chatStoreReducer?.activeQueryId,
		})
			.then((res) => {
				trackEvent(
					EVENTS_ENUM.ADDED_ANALYSIS_TO_DASHBOARD,
					EVENTS_REGISTRY.ADDED_ANALYSIS_TO_DASHBOARD,
					() => ({
						chat_session_id: query?.sessionId,
						dataset_id: datasourceData?.datasource_id,
						dataset_name: datasourceData?.name,
						query_id: chatStoreReducer?.activeQueryId,
						dashboard_id: res?.dashboard_id,
						dashboard_name: selectedDashboard?.title,
						dashboard_type: newDashboardIds.includes(res?.dashboard_id)
							? 'new'
							: 'old',
					}),
				);
				toast.success('Query added to dashboard successfully', {
					duration: 5000,
					action: (
						<Button
							onClick={() => {
								navigate(
									`/app/dashboard/content?id=${res?.dashboard_id}&name=${selectedDashboard?.title}`,
								);
								trackEvent(
									EVENTS_ENUM.VIEW_DASHBOARD_CLICKED,
									EVENTS_REGISTRY.VIEW_DASHBOARD_CLICKED,
									() => ({
										chat_session_id: query?.sessionId,
										dataset_id: datasourceData?.datasource_id,
										dataset_name: datasourceData?.name,
										query_id: chatStoreReducer?.activeQueryId,
										dashboard_id: res?.dashboard_id,
										dashboard_name: selectedDashboard?.title,
									}),
								);
							}}
							className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
						>
							View Dashboard
						</Button>
					),
				});
				setDashboard((prev) => ({
					...prev,
					showAdd: false,
					isAdding: false,
				}));
			})
			.catch((err) => {
				logError(err, { feature: 'chat', action: 'add-query-to-dashboard' });
				toast.error('Something went wrong while adding query to dashboard');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	const filteredList = useMemo(() => {
		return dashboards.filter((item) =>
			item?.title?.toLowerCase()?.includes(search?.trim()?.toLowerCase()),
		);
	}, [search, dashboards]);

	const closeModal = () => {
		setDashboard((prev) => ({ ...prev, showAdd: false, isAdding: false }));
	};

	useEffect(() => {
		if (userDashboardQuery.data) {
			setDashboards(userDashboardQuery.data);
		}
	}, [userDashboardQuery.data]);

	return (
		<Dialog open={open} onOpenChange={closeModal}>
			<DialogContent className="max-w-[31.25rem] ">
				<DialogHeader className="border-b pb-3">
					<DialogTitle>Choose Dashboard</DialogTitle>
					<DialogDescription>
						Select an existing dashboard or create a new one
					</DialogDescription>
				</DialogHeader>
				<div className="my-4 flex gap-2 w-full">
					<InputText
						placeholder="Search dashboard"
						className="w-full"
						value={search}
						setValue={(e) => setSearch(e)}
					/>
					<Button
						variant="secondary"
						className="w-fit rounded-lg bg-purple-8 hover:bg-purple-16 text-purple-100 font-medium"
						onClick={() =>
							setDashboard((prev) => ({ ...prev, showCreate: true }))
						}
					>
						+ New Dashboard
					</Button>
				</div>
				<div className="max-h-[24rem] overflow-y-auto border border-primary10 rounded-xl my-4 w-full !px-0">
					{filteredList && filteredList.length > 0 ? (
						filteredList.map((dashboard) => (
							<div
								key={dashboard.id}
								className="flex justify-between items-center p-3 border-b last:border-none w-full cursor-pointer hover:bg-purple-4"
								onClick={() => setSelectedDashboard(dashboard)}
							>
								<div className="flex items-center gap-2 w-full">
									<div className="bg-purple-4 w-[6.25rem] h-16 rounded-xl flex items-center justify-center pt-1.5">
										<img
											src={graphPlaceholder}
											alt="graph-placeholder"
										/>
									</div>
									<div className="flex flex-col">
										<h4 className="text-primary80 text-base font-semibold max-w-[16rem] truncate">
											{dashboard.title}
										</h4>
										<p className="text-primary60 text-sm font-normal max-w-[16rem] truncate">
											{dashboard?.answer ||
												'there should be a subtitle'}
										</p>
									</div>
								</div>
								{selectedDashboard &&
								selectedDashboard.dashboard_id ===
									dashboard.dashboard_id ? (
									<Button variant="icon" size="sm" className="">
										<span className="material-icons-outlined text-purple-100 text-2xl">
											radio_button_checked
										</span>
									</Button>
								) : null}
							</div>
						))
					) : search ? (
						<div className="w-full p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
							<p className="text-sm text-primary60 font-medium">
								No such dashboard found
							</p>
						</div>
					) : userDashboardQuery.isLoading ? (
						<div className="w-full p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
							<div className="flex items-center space-x-4">
								<Skeleton className="h-12 w-16 rounded-xl bg-purple-4" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-[250px] bg-purple-4" />
									<Skeleton className="h-4 w-[200px] bg-purple-4" />
								</div>
							</div>
						</div>
					) : (
						<div className="w-full p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
							<p className="text-sm text-primary60 font-medium">
								No dashboards found
							</p>
						</div>
					)}
				</div>
				<DialogFooter className="flex justify-between w-full">
					<Button variant="outline" onClick={closeModal}>
						Cancel
					</Button>
					<Button
						onClick={() => handleAddQueryToDashboard()}
						className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
						disabled={isLoading || !selectedDashboard}
					>
						{isLoading ? (
							<i className="bi-arrow-clockwise animate-spin me-2"></i>
						) : null}
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddQueryToDashboard;
