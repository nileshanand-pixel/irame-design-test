import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SourceSelection } from './source-selection';
import { WizardHeader } from './wizard-header';
import { ColumnMapping } from './column-mapping';

export const ConnectDataSourceWizard = ({ onClose, runDetails, csvFiles }) => {
	const [currentStep, setCurrentStep] = useState(1);
	const [files, setFiles] = useState([]);
	const [requiredFiles, setRequiredFiles] = useState([]); // Start empty, will fill from csvFiles
	const [columnMappings, setColumnMappings] = useState([]);

	// Populate requiredFiles from csvFiles prop
	useEffect(() => {
		if (csvFiles && Array.isArray(csvFiles)) {
			setRequiredFiles(
				csvFiles.map((file, idx) => ({
					id: String(idx + 1),
					name: file.file_name,
					description: file.description,
					requiredColumns: file.required_columns.map((col) => ({
						name: col.name,
						description: col.description,
						dataType: col.data_type,
					})),
				})),
			);
		}
	}, [csvFiles]);

	useEffect(() => {
		if (!runDetails) return;
		if (runDetails.status === 'IN_QUEUE') {
			setCurrentStep(1);
		} else if (runDetails.status === 'FILE_VALIDATION_FAILED') {
			setCurrentStep(1);
		} else if (
			runDetails.status === 'FILE_VALIDATION_DONE' ||
			runDetails.status === 'COLUMN_VALIDATION_FAILED' ||
			runDetails.status === 'COLUMN_MAPPING_DONE' ||
			runDetails.status === 'COLUMN_VALIDATION_DONE'
		) {
			setCurrentStep(2);
		} else if (runDetails.status === 'RUNNING') {
			setCurrentStep(2.5);
		}else{
			setCurrentStep(1);
		}
	}, [runDetails]);

	const handleNext = () => {
		if (currentStep < 2) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleRunWorkflow = () => {
		// In a real app, this would post data to an API
		console.log('Running workflow with mappings:', columnMappings);
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
			<div className="bg-white rounded-lg shadow-lg w-full max-w-[65%] xl:max-w-[55%] flex flex-col max-h-[75vh] ">
				<div className="flex justify-between items-center p-6 border-b">
					<h2 className="text-xl font-semibold">Connect Data Source</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>
				<WizardHeader setStep={setCurrentStep} currentStep={currentStep} />
				<div className="flex-1 overflow-y-auto">
					{currentStep === 1 && (
						<SourceSelection
							files={files}
							setFiles={setFiles}
							requiredFiles={requiredFiles}
							setRequiredFiles={setRequiredFiles}
							onNext={handleNext}
							isValidating={runDetails?.status === 'IN_QUEUE'}
							workflowRunDetails={runDetails}
							onCancel={onClose}
						/>
					)}
					{Math.floor(currentStep) === 2 && (
						<ColumnMapping
							requiredFiles={requiredFiles}
							onNext={handleNext}
							onBack={handleBack}
							workflowRunDetails={runDetails}
							isValidating={
								runDetails?.status === 'COLUMN_MAPPING_DONE'
							}
							onCancel={onClose}
						/>
					)}
					{/* {currentStep === 3 && (
						<ReviewAndRun
							files={files}
							requiredFiles={requiredFiles}
							columnMappings={columnMappings}
							onRunWorkflow={handleRunWorkflow}
							onBack={handleBack}
						/>
					)} */}
				</div>
			</div>
		</div>
	);
};
