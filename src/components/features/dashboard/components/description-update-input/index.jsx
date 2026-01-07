import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { updateDashboard } from '../../service/dashboard.service';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import { invalidateDashboardQueries } from '../DashboardDetailPageNew';
import { logError } from '@/lib/logger';

export default function DescriptionUpdateInput({
	dashboardMetadata,
	dashboardId,
	isEditMode,
}) {
	const [description, setDescription] = useState('');
	const [isEditingDescription, setIsEditingDescription] = useState(false);

	const descriptionInputRef = useRef(null);

	useEffect(() => {
		if (isEditingDescription && descriptionInputRef.current) {
			descriptionInputRef.current.focus();
		}
	}, [isEditingDescription]);

	useEffect(() => {
		if (dashboardMetadata) {
			setDescription(dashboardMetadata?.description ?? '');
		}
	}, [dashboardMetadata]);

	const descriptionUpdateMutation = useMutation({
		mutationFn: (newDescription) =>
			updateDashboard(dashboardId, { description: newDescription }),
		onSuccess: () => {
			toast.success('Description updated successfully');
			invalidateDashboardQueries(queryClient, dashboardId);
		},
		onError: (error) => {
			// setEditedDescription(description);
			logError(error, {
				feature: 'dashboard',
				action: 'update-dashboard-description',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
					dashboardId,
				},
			});
			toast.error(
				error?.response?.data?.message || 'Failed to update description',
			);
		},
	});

	const handleDescriptionKeyDown = useCallback(
		(e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				descriptionInputRef.current?.blur();
			} else if (e.key === 'Escape') {
				setIsEditingDescription(false);
			}
		},
		[description],
	);

	const handleDescriptionBlur = useCallback(() => {
		const trimmedDescription = description.trim();

		if (trimmedDescription !== dashboardMetadata?.description) {
			descriptionUpdateMutation.mutate(trimmedDescription);
		}

		setIsEditingDescription(false);
	}, [description, dashboardMetadata]);

	const handleEditDescription = useCallback(() => {
		setIsEditingDescription(true);
	}, []);

	return (
		<>
			{isEditingDescription ? (
				<Input
					ref={descriptionInputRef}
					type="text"
					placeholder="+ Add description..."
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					onBlur={handleDescriptionBlur}
					onKeyDown={handleDescriptionKeyDown}
					// className="max-w-xs placeholder:italic bg-transparent text-sm !p-0"
					className="max-w-[43.75rem] text-sm italic text-[#26064A] h-auto border-none bg-purple-4 !py-2 !pl-4"
				/>
			) : (
				<div
					onClick={isEditMode ? handleEditDescription : undefined}
					className={`text-sm !py-2 text-primary80 ${
						isEditMode ? 'cursor-pointer' : ''
					} ${!description ? 'italic' : ''}`}
				>
					{description || '+ Add description...'}
				</div>
			)}
		</>
	);
}
