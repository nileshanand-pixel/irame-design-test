import React, { Fragment } from 'react';
import { CheckIcon } from 'lucide-react';

export const WizardHeader = ({ setStep, currentStep }) => {
	const steps = [
		{
			number: 1,
			title: 'Source & Files',
		},
		{
			number: 2,
			title: 'Column Mapping',
		},
		// Commented step for future use
		// {
		//   number: 3,
		//   title: 'Review & Run',
		// },
	];

	// const handleStepSelection = (step) => {
	// 	if (step.number !== currentStep) {
	// 		setStep(step.number);
	// 	}
	// };

	return (
		<div className="px-6 py-4 border-b">
			<div className="flex items-center justify-between">
				{steps.map((step, index) => (
					<Fragment key={step.number}>
						<div
							// onClick={() => handleStepSelection(step)}
							className="flex cursor-pointer items-center"
						>
							<div
								className={`
									flex items-center justify-center w-8 h-8 rounded-full
									${
										currentStep > step.number
											? 'bg-[#6A12CD] text-white'
											: currentStep === step.number
												? 'border-2 border-[#6A12CD] text-[#6A12CD]'
												: 'border-2 border-gray-300 text-gray-400'
									}
								`}
							>
								{currentStep > step.number ? (
									<CheckIcon size={16} />
								) : (
									<span>{step.number}</span>
								)}
							</div>
							<span
								className={`ml-2 ${
									currentStep > step.number
										? 'text-gray-900'
										: 'text-gray-400'
								}`}
							>
								{step.title}
							</span>
						</div>
						{index < steps.length - 1 && (
							<div
								className={`flex-1 mx-4 h-[2px] ${
									currentStep > index + 1
										? 'bg-[#6A12CD]'
										: 'bg-gray-200'
								}`}
							/>
						)}
					</Fragment>
				))}
			</div>
		</div>
	);
};
