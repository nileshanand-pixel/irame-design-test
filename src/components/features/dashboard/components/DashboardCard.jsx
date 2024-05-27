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

const DashboardCard = ({ data, refetch, setRefetch }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedTitle, setEditedTitle] = useState(data.tittle);

	const { navigate } = useRouter();
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
				deleteUserDashboard(getToken(), data?.dasboard_id);
			},
		},
	];

	const handleEdit = () => {
		updateDashboardName(getToken(), data?.dasboard_id, editedTitle)
			.then(
				(res) => toast.success('Dashboard updated successfully'),
				setIsEditing(false),
				setRefetch((prevRefetch) => !prevRefetch),
			)
			.catch((err) => {
				console.log('Error updating dashboard', err);
				toast.error('Something went wrong while updating dashboard');
			});
	};
	return (
		<div
			key={data.dasboard_id}
			className="p-6 flex justify-between w-full gap-6 border-b last:border-none border-primary10 cursor-pointer hover:bg-purple-2"
			onClick={() =>
				isEditing
					? null
					: navigate(`/app/dashboard/content?id=${data?.dasboard_id}`)
			}
		>
			<div className="flex gap-6">
				<div className="bg-purple-4 w-[100px] h-16 rounded-xl">
					{data?.placeholder}
				</div>
				<div className="flex flex-col gap-2">
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
							{data?.tittle}
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
					{isEditing ? 'check_circle' : 'edit'}
				</span>
				<DotsDropdown options={dashboardMutations} />
			</div>
		</div>
	);
};

export default DashboardCard;
