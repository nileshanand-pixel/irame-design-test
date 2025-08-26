import { useState, useEffect, useRef } from 'react';

// Workflow stepper hook
export const useStructuredStepper = (baseStepper, steps, runDetails) => {
	const prevStatusRef = useRef(null);

	const statusToStepMap = {
		IN_QUEUE: 'upload_files',
		FILE_VALIDATION_FAILED: 'upload_files',
		FILE_VALIDATION_DONE: 'map_files',
		COLUMN_VALIDATION_FAILED: 'map_files',
		COLUMN_MAPPING_DONE: 'map_files',
		COLUMN_VALIDATION_DONE: 'map_files',
		RUNNING: 'map_columns',
	};

	useEffect(() => {
		if (!runDetails || !runDetails.status) return;
		if (prevStatusRef.current !== runDetails.status) {
			const stepId = statusToStepMap[runDetails.status] || 'upload_files';
			if (stepId !== baseStepper.current.id) {
				baseStepper.goTo(stepId);
			}
			prevStatusRef.current = runDetails.status;
		}
	}, [runDetails]);

	return {
		...baseStepper,
		goTo: (stepId) => {
			const targetIndex = steps.findIndex((step) => step.id === stepId);
			const currentIndex = steps.findIndex(
				(step) => step.id === baseStepper.current.id,
			);
			// if (targetIndex <= currentIndex) {
			// }
			baseStepper.goTo(stepId);
		},
	};
};
