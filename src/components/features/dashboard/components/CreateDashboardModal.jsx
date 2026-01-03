import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDashboard } from '../service/dashboard.service';
import { logError } from '@/lib/logger';
import { toast } from '@/lib/toast';
import CircularLoader from '@/components/elements/loading/CircularLoader';

const CreateDashboardModal = ({ open, onOpenChange, onSuccess }) => {
	const [dashboardName, setDashboardName] = useState('');
	const [description, setDescription] = useState('');
	const [errors, setErrors] = useState({});
	const queryClient = useQueryClient();

	const createDashboardMutation = useMutation({
		mutationFn: (data) => createDashboard(data),
		onSuccess: (data) => {
			toast.success('Dashboard created successfully');
			// Invalidate and refetch dashboard queries with correct query keys
			queryClient.invalidateQueries({ queryKey: ['my-dashboards'] });
			queryClient.invalidateQueries({ queryKey: ['shared-dashboards'] });
			// Reset form and close modal
			setDashboardName('');
			setDescription('');
			setErrors({});
			onOpenChange(false);
			if (onSuccess) {
				onSuccess(data);
			}
		},
		onError: (error) => {
			logError(error, {
				feature: 'live-dashboard',
				action: 'create-dashboard',
			});

			// Check for duplicate key error
			if (error.response?.data?.error_code === 'duplicate_key') {
				const errorMessage =
					error.response?.data?.message ||
					'A dashboard with this name already exists';
				setErrors({ dashboardName: errorMessage });
				toast.error(errorMessage);
			} else {
				// Generic error for other cases
				toast.error('Failed to create dashboard');
			}
		},
	});

	const handleClose = () => {
		setDashboardName('');
		setDescription('');
		setErrors({});
		onOpenChange(false);
	};

	const handleCreate = () => {
		setErrors({});

		if (!dashboardName.trim()) {
			setErrors({ dashboardName: 'Dashboard name is required' });
			return;
		}

		// Call create API directly
		createDashboardMutation.mutate({
			title: dashboardName.trim(),
			description: description.trim(),
		});
	};

	const isLoading = createDashboardMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-xl p-0 rounded-lg gap-0" hideClose>
				<DialogHeader className="p-4 border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex-shrink-0">
								<img
									src="/svg/dash-widget.svg"
									alt="Dashboard"
									className="w-7 h-7"
								/>
							</div>
							<DialogTitle className="font-semibold text-[#26064A]">
								Create New Dashboard
							</DialogTitle>
						</div>
						<button
							onClick={handleClose}
							className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none disabled:pointer-events-none"
						>
							<X className="h-5 w-5 text-gray-500" />
							<span className="sr-only">Close</span>
						</button>
					</div>
				</DialogHeader>

				<div className="px-6 py-5 space-y-4">
					{/* Dashboard Name Field */}
					<div className="space-y-2">
						<Label
							htmlFor="dashboard-name"
							className="text-sm font-medium text-[#26064A]"
						>
							Dashboard Name
							<span className="text-[#C73A3A] ml-1">*</span>
						</Label>
						<Input
							id="dashboard-name"
							placeholder="Enter Dashboard Name"
							value={dashboardName}
							onChange={(e) => setDashboardName(e.target.value)}
							className={errors.dashboardName && 'border-red-500'}
							disabled={isLoading}
						/>
						{errors.dashboardName && (
							<p className="text-sm text-red-500">
								{errors.dashboardName}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="dashboard-description"
							className="text-sm font-medium text-[#26064A]"
						>
							Description
						</Label>
						<Input
							id="dashboard-description"
							placeholder="Enter Description Here"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isLoading}
						/>
					</div>
				</div>

				<div className="px-6 pb-6 flex justify-end">
					<Button
						onClick={handleCreate}
						disabled={isLoading || !dashboardName.trim()}
						className="px-4 py-2 font-semibold flex items-center gap-2"
					>
						{isLoading ? (
							<>
								<CircularLoader size="sm" />
								Creating...
							</>
						) : (
							'Create'
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CreateDashboardModal;
