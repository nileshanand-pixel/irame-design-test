import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { closeModal } from '@/redux/reducer/modalReducer';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { Loader2 } from 'lucide-react'; // assuming you're using lucide-react for icons
import { createReport } from '../service/reports.service';
import { queryClient } from '@/lib/react-query';

const CreateReportModal = () => {
	const dispatch = useDispatch();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');

	const handleClose = () => {
		if (createReportMutation.isLoading) return;
		dispatch(closeModal('createReport'));
		setTitle('');
		setDescription('');
	};

	const createReportMutation = useMutation({
		mutationFn: async (data) => {
			await createReport(data);
		},
		onSuccess: () => {
			toast.success('Report created successfully');
			handleClose();
			queryClient.invalidateQueries(['user-reports']);
			// TODO: navigate to report page
		},
		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'create-report',
			});
			toast.error('Something went wrong while creating report');
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		const trimmedTitle = title.trim();
		const trimmedDescription = description.trim();
		createReportMutation.mutate({
			name: trimmedTitle,
			description: trimmedDescription,
		});
	};

	const trimmedTitle = title.trim();
	const trimmedDescription = description.trim();
	const isSubmitDisabled =
		!trimmedTitle || !trimmedDescription || createReportMutation.isLoading;

	return (
		<Dialog open onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] p-6">
				<DialogHeader>
					<DialogTitle className="text-black/90">
						Create Report
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 ">
					<div className="space-y-2">
						<Label className="text-sm text-black/60">Report</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							placeholder="Report 01 - April 01, 2025"
							disabled={createReportMutation.isPending}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-sm text-black/60">
							Add a description this Workflow
						</Label>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Report Description goes here"
							disabled={createReportMutation.isLoading}
						/>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 pt-4">
						<Button
							variant="secondary1"
							className="flex-1"
							type="button"
							onClick={handleClose}
							disabled={createReportMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							className="flex-1 font-medium"
							type="submit"
							disabled={isSubmitDisabled}
						>
							{createReportMutation.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								'Create Report'
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default CreateReportModal;
