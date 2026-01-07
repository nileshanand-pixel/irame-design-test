import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import DashboardSelectionStep from './components/DashboardSelectionStep';
import WidgetSelectionStep from './components/WidgetSelectionStep';
import { STEPS, DIALOG_CLASSES } from './constants';
import dashWidgetIcon from '/svg/dash-widget.svg';
import { cn } from '@/lib/utils';

/**
 * AddToDashboardModal Component
 *
 * A two-step modal for adding query results to dashboards
 *
 * Props:
 * @param {boolean} open - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {string} queryId - ID of the current query to add to dashboard (required)
 * @param {string} [initialSelectedDashboardId] - Optional pre-selected dashboard ID
 * @param {object} [initialSelectedDashboard] - Optional pre-selected dashboard object
 *
 * STEP 1: Dashboard Selection (DashboardSelectionStep)
 * =====================================================
 * - Makes single API call: GET /dashboard?query_id=xxx
 * - Shows all dashboards in dropdown + dashboards containing query in list
 * - Handles dashboard creation
 * - Manages selection state internally
 *
 * STEP 2: Widget Selection (WidgetSelectionStep)
 * ===============================================
 * - Fetches widgets from query data
 * - Pre-selects existing widgets in dashboard
 * - Manages widget selection state internally
 * - Handles submission to backend
 */
const AddToDashboardModal = ({
	open,
	onClose,
	queryId,
	initialSelectedDashboardId,
	initialSelectedDashboard,
}) => {
	// Step management
	const [currentStep, setCurrentStep] = useState(
		initialSelectedDashboard ? STEPS.SELECT_WIDGETS : STEPS.SELECT_DASHBOARD,
	);

	// Store selected dashboard from Step 1
	const [selectedDashboard, setSelectedDashboard] = useState(
		initialSelectedDashboard || null,
	);

	// Initialize step when modal opens
	useEffect(() => {
		if (open) {
			if (initialSelectedDashboard) {
				setSelectedDashboard(initialSelectedDashboard);
				setCurrentStep(STEPS.SELECT_WIDGETS);
			} else {
				setCurrentStep(STEPS.SELECT_DASHBOARD);
			}
		}
	}, [open, initialSelectedDashboard]);

	// Reset state when modal closes
	useEffect(() => {
		if (!open) {
			setCurrentStep(STEPS.SELECT_DASHBOARD);
			setSelectedDashboard(null);
		}
	}, [open]);

	// Handler: Close modal and reset
	const handleClose = useCallback(() => {
		setCurrentStep(STEPS.SELECT_DASHBOARD);
		setSelectedDashboard(null);
		onClose();
	}, [onClose]);

	// Handler: Continue from Step 1 to Step 2
	const handleContinueToStep2 = useCallback((dashboard) => {
		setSelectedDashboard(dashboard);
		setCurrentStep(STEPS.SELECT_WIDGETS);
	}, []);

	// Handler: Go back from Step 2 to Step 1
	const handleBackToStep1 = useCallback(() => {
		setCurrentStep(STEPS.SELECT_DASHBOARD);
	}, []);

	// Handler: Success after submission in Step 2
	const handleSubmitSuccess = useCallback(() => {
		handleClose();
	}, [handleClose]);

	// Dynamic dialog className based on current step
	const dialogClassName = useMemo(() => {
		return currentStep === STEPS.SELECT_DASHBOARD
			? DIALOG_CLASSES.SELECT_DASHBOARD
			: DIALOG_CLASSES.SELECT_WIDGETS;
	}, [currentStep]);

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className={cn('transition-all', dialogClassName)}>
				<DialogHeader className="flex-shrink-0 border-b p-4 pt-6">
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0">
							<img
								src={dashWidgetIcon}
								alt="Dashboard Widget"
								className="size-10"
							/>
						</div>
						<div className="flex-1">
							<DialogTitle className="text-[#26064A] font-semibold">
								Add Widgets to Your Dashboard
							</DialogTitle>
							<DialogDescription className="mt-1 text-[#26064A] text-xs">
								{currentStep === STEPS.SELECT_DASHBOARD
									? 'Select a dashboard to add your query results'
									: "Select the graphs and tables you'd like to include"}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Step 1: Dashboard Selection */}
				{currentStep === STEPS.SELECT_DASHBOARD && (
					<DashboardSelectionStep
						queryId={queryId}
						onContinue={handleContinueToStep2}
						initialSelectedDashboardId={initialSelectedDashboardId}
						initialSelectedDashboard={initialSelectedDashboard}
					/>
				)}

				{/* Step 2: Widget Selection */}
				{currentStep === STEPS.SELECT_WIDGETS && (
					<WidgetSelectionStep
						selectedDashboard={selectedDashboard}
						queryId={queryId}
						onBack={handleBackToStep1}
						onSuccess={handleSubmitSuccess}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default AddToDashboardModal;
