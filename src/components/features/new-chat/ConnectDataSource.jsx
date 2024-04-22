import { Button } from '@/components/ui/button';
import UploadInput from './UploadInput';
import PropTypes from 'prop-types';
import ChooseDataSourceDialog from './ChooseDataSourceDialog';
import { useState } from 'react';

const ConnectDataSource = ({
	handleFileUpload,
	files,
	setFiles,
	progress,
	handleNextStep,
}) => {
	const [open, setOpen] = useState(false);
	const [selectedDataSource, setSelectedDataSource] = useState('');

	return (
		<div className="flex flex-col gap-4">
			<UploadInput
				onFileUpload={handleFileUpload}
				files={files}
				setFiles={setFiles}
				progress={progress}
				setOpen={setOpen}
			/>
			<div className="flex justify-between">
				{files.length > 0 && progress === 100.0 ? (
					<Button
						onClick={() => handleNextStep(2)}
						className="rounded-[100px] h-11 hover:text-white hover:bg-purple100 hover:opacity-90 light"
					>
						Continue
					</Button>
				) : null}
			</div>
			<ChooseDataSourceDialog
				open={open}
				setOpen={setOpen}
				selectedDataSource={selectedDataSource}
				setSelectedDataSource={setSelectedDataSource}
				handleNextStep={handleNextStep}
			/>
		</div>
	);
};

export default ConnectDataSource;

ConnectDataSource.propTypes = {
	handleFileUpload: PropTypes.func.isRequired,
	files: PropTypes.array.isRequired,
	setFiles: PropTypes.func.isRequired,
	progress: PropTypes.number.isRequired,
	handleNextStep: PropTypes.func.isRequired,
};
