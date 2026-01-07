import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { updateDashboardName } from '../../service/dashboard.service';
import { toast } from '@/lib/toast';
import { invalidateDashboardQueries } from '../DashboardDetailPageNew';
import { logError } from '@/lib/logger';

export default function TitleUpdateInput({
	dashboardMetadata,
	dashboardId,
	isEditMode,
}) {
	const [title, setTitle] = useState();
	const [isEditingTitle, setIsEditingTitle] = useState(false);

	const titleInputRef = useRef(null);

	const queryClient = useQueryClient();

	useEffect(() => {
		if (isEditingTitle && titleInputRef.current) {
			titleInputRef.current.focus();
		}
	}, [isEditingTitle]);

	const titleUpdateMutation = useMutation({
		mutationFn: (newTitle) => updateDashboardName(dashboardId, newTitle),
		onSuccess: () => {
			toast.success('Dashboard name updated successfully');
			invalidateDashboardQueries(queryClient, dashboardId);
		},
		onError: (error) => {
			logError(error, {
				feature: 'dashboard',
				action: 'update-dashboard-name',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
					dashboardId,
				},
			});
			toast.error('Failed to update dashboard name');
		},
	});

	const handleTitleBlur = useCallback(() => {
		const trimmedTitle = title.trim();
		if (trimmedTitle && trimmedTitle !== dashboardMetadata?.title) {
			if (trimmedTitle.length >= 1) {
				titleUpdateMutation.mutate(trimmedTitle);
			} else {
				toast.error('Dashboard name cannot be empty');
			}
		}
		setIsEditingTitle(false);
	}, [title]);

	useEffect(() => {
		if (dashboardMetadata) {
			setTitle(dashboardMetadata?.title ?? '');
		}
	}, [dashboardMetadata]);

	const handleTitleKeyDown = useCallback((e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			titleInputRef.current?.blur();
		} else if (e.key === 'Escape') {
			setIsEditingTitle(false);
		}
	}, []);

	const handleRenameBoard = useCallback(() => {
		setIsEditingTitle(true);
	}, []);

	return (
		<>
			{isEditingTitle ? (
				<Input
					ref={titleInputRef}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onBlur={handleTitleBlur}
					onKeyDown={handleTitleKeyDown}
					className="w-full text-xl italic text-[#26064A] h-auto border-none bg-purple-4 !py-2 !pl-4"
				/>
			) : (
				<div
					onClick={isEditMode ? handleRenameBoard : undefined}
					className={`py-2 w-full truncate text-xl font-semibold text-[#26064A] ${isEditMode ? 'cursor-pointer hover:text-[#6A12CD] transition-colors' : ''}`}
				>
					{title}
				</div>
			)}
		</>
	);
}
