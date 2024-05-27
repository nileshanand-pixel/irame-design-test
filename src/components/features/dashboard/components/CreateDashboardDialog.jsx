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
import React from 'react';

const CreateDashboardDialog = ({
	open,
	setOpen,
	dashboardName,
	setDashboardName,
	handleCreateNewDashboard,
	errors,
	isLoading,
}) => {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[500px] ">
				<DialogHeader className="border-b pb-3">
					<DialogTitle>New Dashboard</DialogTitle>
					<DialogDescription>Name your new dashboard</DialogDescription>
				</DialogHeader>
				<div className="my-4">
					<InputText
						label="Dashboard Name"
						placeholder="Enter dashboard name"
						className="w-full"
						value={dashboardName}
						setValue={(e) => setDashboardName(e)}
						error={errors?.dashboardName}
						errorText={errors?.dashboardName}
					/>
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
						onClick={() => handleCreateNewDashboard()}
						className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
						disabled={isLoading}
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

export default CreateDashboardDialog;
