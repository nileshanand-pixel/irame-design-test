import { useState, useEffect, useRef } from 'react';

// Workflow stepper hook
export const useStructuredStepper = (baseStepper, steps, runDetails) => {
	const statusToStepMap = {
		IN_QUEUE: 'map_files',
		FILE_VALIDATION_FAILED: 'map_files',
		FILE_VALIDATION_DONE: 'map_columns',
		COLUMN_VALIDATION_FAILED: 'map_columns',
		COLUMN_MAPPING_DONE: 'map_columns',
		COLUMN_VALIDATION_DONE: 'map_columns',
		RUNNING: 'map_columns',
	};

	useEffect(() => {
		if (!runDetails || !runDetails.status) return;
		const stepId = statusToStepMap[runDetails.status] || 'upload_files';
		if (stepId !== baseStepper.current.id) {
			baseStepper.goTo(stepId);
		}
	}, [runDetails]);

	return {
		...baseStepper,
		goTo: (stepId) => {
			const targetIndex = steps.findIndex((step) => step.id === stepId);
			const currentIndex = steps.findIndex(
				(step) => step.id === baseStepper.current.id,
			);
			baseStepper.goTo(stepId);
		},
	};
};
