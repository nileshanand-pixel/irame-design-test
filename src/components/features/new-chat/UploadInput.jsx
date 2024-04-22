import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';
import { welcomeTypography } from './config';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import csvIcon from '@/assets/icons/csv.svg';
import pdfIcon from '@/assets/icons/pdf.svg';

const UploadInput = ({ onFileUpload, files, setFiles, progress, setOpen }) => {
	const navigate = useNavigate();
	const [showFormats, setShowFormats] = useState(false);

	useEffect(() => {
		console.log(progress);
	}, [progress]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: 'application/pdf, text/csv',
		// onDrop: (acceptedFiles) => {
		// 	setFiles((prevFiles) => {
		// 		if (!Array.isArray(prevFiles)) {
		// 			prevFiles = [];
		// 		}
		// 		return [...prevFiles, ...acceptedFiles];
		// 	});
		// 	onFileUpload(acceptedFiles); // Pass uploaded files to parent component if needed
		// },
	});
	const handleRemoveFile = (e, file, idx) => {
		e.preventDefault();
		e.stopPropagation();
		let tempArr = [...files];
		tempArr.splice(idx, 1);
		setFiles(tempArr);
	};
	const handleSelectFromLibrary = (e) => {
		e.stopPropagation();
		setOpen(true);
	};
	const showSupportedFormats = (e) => {
		e.stopPropagation();
		setShowFormats(!showFormats);
	};
	const formatFileSize = (size) => {
		if (size < 1024) {
			return size + ' B';
		} else if (size < 1024 * 1024) {
			return (size / 1024).toFixed(2) + ' KB';
		} else if (size < 1024 * 1024 * 1024) {
			return (size / (1024 * 1024)).toFixed(2) + ' MB';
		} else {
			return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
		}
	};
	const handleConnectDataSource = (e) => {
		e.stopPropagation();
		navigate('/app/configuration');
	};

	return (
		<div
			className={`border border-dashed border-purple-24 bg-purple-2 py-6 rounded-2xl flex justify-center ${
				isDragActive ? 'border-primary80' : ''
			}`}
			// {...getRootProps()}
		>
			<div className="flex flex-col">
				{/* <input {...getInputProps()} /> */}
				{isDragActive ? (
					<p className="text-primary80 flex flex-col gap-1 text-center min-w-[29.5rem] min-h-[22.5rem]">
						Drop the files here...
					</p>
				) : (
					<>
						<div className="flex flex-col gap-1 text-center min-w-[29.5rem]">
							<h2 className="text-4xl font-semibold text-primary80">
								{welcomeTypography?.subHeading1}
							</h2>
							{/* <p className="text-sm font-medium text-primary80">
								{welcomeTypography.subHeading2}
							</p> */}
							{/* <div className="relative w-full py-6">
								<p className="or-tagline px-[5px] text-xs text-purple-20">
									OR
								</p>
							</div> */}
							<div className="flex gap-2 justify-center w-full z-10 mt-10">
								<Button
									variant="secondary"
									className="w-full bg-purple-8 hover:bg-purple-16 text-purple-100 font-medium"
									onClick={(e) => handleConnectDataSource(e)}
								>
									{welcomeTypography?.btn1Text}
								</Button>
								<Button
									variant="outline"
									className="w-full hover:bg-purple-8 border-purple-8 text-purple-100 font-medium hover:text-purple-100"
									onClick={(e) => handleSelectFromLibrary(e)}
								>
									{welcomeTypography?.btn2Text}
								</Button>
							</div>
							<div
								className="flex cursor-pointer items-center justify-center mt-6 gap-2"
								onClick={(e) => {
									showSupportedFormats(e);
								}}
							>
								<p className="text-sm font-medium leading-4 text-primary100">
									<i className="bi-folder me-2"></i>
									{welcomeTypography?.fileStructure}
									{showFormats ? (
										<i className="bi-chevron-up ms-2"></i>
									) : (
										<i className={`bi-chevron-down ms-2 `}></i>
									)}
								</p>
							</div>
							{showFormats ? (
								<div className="flex justify-center space-x-2 mt-2 w-full transition ease-in">
									<img
										src={pdfIcon}
										alt="pdf"
										className="w-6 h-6"
									/>
									<img
										src={csvIcon}
										alt="csv"
										className="w-6 h-6"
									/>
								</div>
							) : null}
						</div>
					</>
				)}
				<div
					className="w-full flex mt-6 gap-3 flex-col "
					onClick={(e) => e.stopPropagation()}
				>
					{files?.map((file, idx) => (
						<div
							className="px-4 py-2.5 z-10 bg-purple-4 rounded "
							key={file.name}
						>
							<div className="flex justify-between">
								<p className="text-sm text-purple-100 flex">
									{file.name}&nbsp;
									<p className="text-sm font-medium text-primary80">{`(${formatFileSize(
										file?.size,
									)})`}</p>
								</p>
								<span
									onClick={(e) => handleRemoveFile(e, file, idx)}
									className="flex items-center gap-4 text-sm font-medium cursor-pointer"
								>
									{progress < 100 ? <p>uploading...</p> : null}x
								</span>
							</div>
							{progress <= 99.99 ? (
								<div className="mt-4">
									<Progress value={progress} className="h-2" />
								</div>
							) : null}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

UploadInput.propTypes = {
	onFileUpload: PropTypes.func,
	files: PropTypes.array,
	setFiles: PropTypes.func,
};

export default UploadInput;
