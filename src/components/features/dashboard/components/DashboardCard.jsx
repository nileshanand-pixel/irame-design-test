import DotsDropdown from '@/components/elements/DotsDropdown';
import React, { useState } from 'react';
import {
	deleteUserDashboard,
	updateDashboardName,
} from '../service/dashboard.service';
import { getToken } from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import InputText from '@/components/elements/InputText';
import { toast } from 'sonner';
import graphPlaceholder from '@/assets/icons/graph-placeholder.svg';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

const DashboardCard = ({ data, refetch, setRefetch }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedTitle, setEditedTitle] = useState(data.title);

	const { navigate } = useRouter();

	const userToken = getToken();

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteUserDashboard(userToken, id),
		onSuccess: () => {
			toast.success('Dashboard deleted successfully');
			queryClient.invalidateQueries(['user-dashboard'], {
				refetchActive: true,
				refetchInactive: true,
			});
		},
	});
	const editMutation = useMutation({
		mutationFn: ({ id, name }) => updateDashboardName(userToken, id, name),
		onSuccess: () => {
			setIsEditing(false);
			toast.success('Dashboard updated successfully');
			queryClient.invalidateQueries(['user-dashboard'], {
				refetchActive: true,
				refetchInactive: true,
			});
		},
		onError: (err) => {
			console.log('Error updating dashboard', err);
			toast.error('Something went wrong while updating dashboard');
		},
	});

	const dashboardMutations = [
		// {
		//     type: 'item',
		//     label: 'Edit',
		//     onClick: () => console.log('Edit'),
		// },
		// {
		//     type: 'separator',
		// },
		{
			type: 'item',
			label: 'Delete',
			onClick: (e) => {
				e.stopPropagation();
				deleteMutation.mutateAsync(data?.dashboard_id);
			},
		},
	];

	const handleEdit = () => {
		editMutation.mutateAsync({ id: data.dashboard_id, name: editedTitle });
	};
	return (
		<div
			key={data.dashboard_id}
			className="p-6 flex justify-between w-full gap-6 border-b last:border-none border-primary10 cursor-pointer hover:bg-purple-2"
			onClick={isEditing? null : () => {
				trackEvent(
					EVENTS_ENUM.DASHBOARD_CLICKED,
					EVENTS_REGISTRY.DASHBOARD_CLICKED,
					() => ({
						dashboard_id: data.dashboard_id,
						from: 'dashboard-page',
						name: data?.title,
					}),
				);
				navigate(
					`/app/dashboard/content?id=${data?.dashboard_id}&name=${data?.title}`,
				)
			} 
			}
		>
			<div className="flex gap-6">
				<div className="bg-purple-4 w-[100px]  rounded-xl flex items-center justify-center pt-1.5">
					<img src={graphPlaceholder} alt="graph-placeholder" />
				</div>
				<div className="flex flex-col">
					{isEditing ? (
						<InputText
							value={editedTitle}
							setValue={(e) => setEditedTitle(e)}
							onClick={(e) => e.stopPropagation()}
							variant="ghost"
							className="border-transparent bg-transparent w-[20rem]"
							inputMainClass="border-none bg-purple-4 w-full"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleEdit();
								}
							}}
							onBlur={() => handleEdit()}
						/>
					) : (
						<h4 className="text-primary80 text-medium font-semibold">
							{data?.title}
						</h4>
					)}

					<p className="text-primary60 text-sm font-normal">
						{data?.answer || 'there should be a subtitle'}
					</p>
				</div>
			</div>
			<div className="flex items-start justify-start gap-1">
				<span
					className="material-symbols-outlined text-primary100 cursor-pointer hover:bg-purple-4 rounded-full p-2"
					onClick={(e) => {
						e.stopPropagation();
						setIsEditing(isEditing ? false : true);
					}}
				>
					{isEditing ? (
						'check_circle'
					) : (
						<img
							src={`https://d2vkmtgu2mxkyq.cloudfront.net/pencil.svg`}
							className="me-1 size-6"
							alt="edit-pencil"
						/>
					)}
				</span>
				<DotsDropdown options={dashboardMutations} />
			</div>
		</div>
	);
};

export default DashboardCard;
