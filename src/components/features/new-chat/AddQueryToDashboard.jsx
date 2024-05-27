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
import { getToken } from '@/lib/utils';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/hooks/useRouter';
import { toast } from 'sonner';

const AddQueryToDashboard = ({ open, setOpen, setShowCreateDashboard }) => {
	const [dashboards, setDashboards] = useState([]);
	const [search, setSearch] = useState('');
	const [selectedDashboard, setSelectedDashboard] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const { query } = useRouter();

	const fetchDashboards = async () => {
		const resp = await getUserDashboard(getToken());
		setDashboards(resp);
	};

	const handleAddQueryToDashboard = () => {
		setIsLoading(true);
		createDashboardContent(getToken(), selectedDashboard.dasboard_id, {
			query_id: query?.queryId,
		})
			.then((res) => {
				toast.success('Query added to dashboard successfully');
				setOpen(false);
			})
			.catch((err) => {
				toast.error('Something went wrong while adding query to dashboard');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	const filteredList = useMemo(() => {
		return dashboards.filter((item) =>
			item?.tittle?.toLowerCase()?.includes(search?.trim()?.toLowerCase()),
		);
	}, [search, dashboards]);

	useEffect(() => {
		fetchDashboards();
	}, []);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[500px] ">
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
						// error={errors?.dashboardName}
						// errorText={errors?.dashboardName}
					/>
					<Button
						variant="secondary"
						className="w-fit rounded-lg bg-purple-8 hover:bg-purple-16 text-purple-100 font-medium"
						onClick={() => setShowCreateDashboard(true)}
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
									<div className="bg-purple-4 w-[100px] h-16 rounded-xl">
										{dashboard.placeholder}
									</div>
									<div className="flex flex-col gap-2">
										<h4 className="text-primary80 text-base font-semibold max-w-[16rem] truncate">
											{dashboard.tittle}
										</h4>
										<p className="text-primary60 text-sm font-normal max-w-[16rem] truncate">
											{dashboard?.answer ||
												'there should be a subtitle'}
										</p>
									</div>
								</div>
								{selectedDashboard &&
								selectedDashboard.dasboard_id ===
									dashboard.dasboard_id ? (
									<Button variant="icon" size="sm" className="">
										<span className="material-icons-outlined text-purple-100">
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
					) : (
						<div className="w-full p-6 bg-white border border-primary1 rounded-s-xl rounded-e-xl">
							<div className="flex items-center space-x-4">
								<Skeleton className="h-12 w-16 rounded-xl bg-purple-4" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-[250px] bg-purple-4" />
									<Skeleton className="h-4 w-[200px] bg-purple-4" />
								</div>
							</div>
						</div>
					)}
				</div>
				<DialogFooter className="flex justify-between w-full">
					<Button
						variant="outline"
						onClick={() => {
							setOpen(false);
						}}
					>
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
