import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { MdRefresh } from 'react-icons/md';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { updateDashboardRefreshSettings } from '../service/dashboard.service';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { queryClient } from '@/lib/react-query';

const REFRESH_OPTIONS = [
	{ label: 'Off', value: 'off' },
	{ label: 'Daily', value: '1440' },
	{ label: 'Weekly', value: '10080' },
	{ label: 'Biweekly', value: '20160' },
	{ label: 'Monthly', value: '43200' },
	{ label: 'Quarterly', value: '129600' },
	{ label: 'Semi-Annually', value: '262800' },
	{ label: 'Annually', value: '525600' },
];

const AutoRefreshDropdown = ({ dashboardMetadata, dashboardId }) => {
	const [autoRefresh, setAutoRefresh] = useState('off');
	const [refreshOptions, setRefreshOptions] = useState(REFRESH_OPTIONS);

	// Mutation for updating dashboard refresh settings
	const updateRefreshMutation = useMutation({
		mutationFn: ({ dashboardId, intervalInSeconds }) =>
			updateDashboardRefreshSettings(dashboardId, intervalInSeconds),
		onSuccess: (data, variables) => {
			setAutoRefresh(String(variables.intervalInSeconds / 60));
			const minutes = variables.intervalInSeconds / 60;
			const message =
				variables.intervalInSeconds === 0
					? 'Auto-refresh disabled'
					: `Auto-refresh set to ${minutes} minute${minutes > 1 ? 's' : ''}`;
			toast.success(message);

			// Invalidate dashboard metadata to refetch updated data
			queryClient.invalidateQueries({
				queryKey: ['dashboard-metadata', dashboardId],
			});
		},
		onError: (error, variables) => {
			logError(error, {
				feature: 'dashboard',
				action: 'update-auto-refresh-settings',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
					dashboardId: variables.dashboardId,
					intervalInSeconds: variables.intervalInSeconds,
				},
			});
			toast.error(
				error?.response?.data?.message ||
					'Failed to update auto-refresh settings',
			);
		},
	});

	useEffect(() => {
		const refreshIntervalInSeconds = dashboardMetadata?.auto_refresh_interval;

		if (refreshIntervalInSeconds) {
			// add option to refresh options if not already present
			const minutes = refreshIntervalInSeconds / 60;
			const optionExists = refreshOptions.find(
				(opt) => Number(opt.value) === minutes,
			);
			if (!optionExists && minutes > 0) {
				// format the label as x days y hours z minutes
				const totalMinutes = Math.floor(minutes);
				const days = Math.floor(totalMinutes / 1440);
				const hours = Math.floor((totalMinutes % 1440) / 60);
				const mins = totalMinutes % 60;

				const parts = [];
				if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
				if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
				if (mins) parts.push(`${mins} minute${mins > 1 ? 's' : ''}`);

				const label = parts.length ? parts.join(' ') : '0 minutes';

				const newOption = {
					label,
					value: String(minutes),
				};
				setRefreshOptions((prevOptions) => [...prevOptions, newOption]);
			}
			setAutoRefresh(String(refreshIntervalInSeconds / 60));
		} else {
			setAutoRefresh('off');
		}
	}, [dashboardMetadata, refreshOptions]);

	const handleChange = (value) => {
		// Convert minutes to seconds (0 if 'off')
		const intervalInSeconds = value === 'off' ? null : Number(value) * 60;

		// Call the API
		updateRefreshMutation.mutate({
			dashboardId,
			intervalInSeconds,
		});
	};

	return (
		<Select
			value={autoRefresh}
			onValueChange={handleChange}
			disabled={updateRefreshMutation.isPending}
		>
			<SelectTrigger
				className={cn(
					'px-1 py-[0.375rem] rounded-lg bg-white border border-[#26064A1A] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]',
					'hover:bg-white focus:ring-0 focus:ring-offset-0',
					'[&>svg]:text-transparent flex justify-center w-[16.25rem]',
				)}
			>
				<SelectValue placeholder="Off">
					<div className="flex items-center gap-2">
						<MdRefresh className="w-4 h-4" />
						<span className="text-primary80 mr-2 text-sm font-medium">
							<span className="mr-1">Auto refresh:</span>
							{updateRefreshMutation?.isPending
								? 'Updating...'
								: refreshOptions.find(
										(opt) => opt.value === autoRefresh,
									)?.label}
						</span>
					</div>
				</SelectValue>
			</SelectTrigger>

			<SelectContent
				className={cn(
					'rounded-[0.625rem] border border-[#E5E7EB] bg-white shadow-md',
					'p-0 w-[12.5rem] overflow-hidden',
				)}
			>
				{refreshOptions.map((option) => {
					const isSelected = option.value === autoRefresh;
					return (
						<SelectItem
							key={option.value}
							value={option.value}
							className={cn(
								'cursor-pointer text-sm',
								'px-4 py-3',
								'hover:bg-[rgba(106,18,205,0.08)]',
								'focus:bg-[rgba(106,18,205,0.08)]',
								'data-[highlighted]:bg-[rgba(106,18,205,0.08)]',
								'outline-none',
								'[&>span:first-child>svg]:text-[#6A12CD]',
								isSelected && 'text-[#6A12CD] bg-transparent',
							)}
						>
							<span
								className={cn(
									'text-sm text-center',
									isSelected ? 'text-[#7C3AED]' : 'text-[#374151]',
								)}
							>
								{option.label}
							</span>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
};

export default AutoRefreshDropdown;
