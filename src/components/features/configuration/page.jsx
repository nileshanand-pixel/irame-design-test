import InputText from '@/components/elements/InputText';
import { Input } from '@/components/ui/input';
import { formatFileSize, getToken } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import excel from '@/assets/icons/ms_excel.svg';
import { Button } from '@/components/ui/button';
import {
	createNewDtaSource,
	deleteDataSource,
	getDataSources,
	uploadFile,
} from './service/configuration.service';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';
import QueueStatus from '../new-chat/QueueStatus';
import { intent } from './configuration.content';

const Configuration = () => {
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState({});
	const [datasourceName, setDatasourceName] = useState('');
	const [formErrors, setFormErrors] = useState({});
	const [dataSources, setDataSources] = useState([]);
	const [hideUpload, setHideUpload] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [existingDatasourceId, setExistingDataSourceId] = useState(null);
	const [dataSourceIntent, setDataSourceIntent] = useState([]);

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);

	const { navigate } = useRouter();

	const inputRef = useRef();

	const handleRemoveFile = (e, file, idx) => {
		e.preventDefault();
		e.stopPropagation();
		let tempArr = [...files];
		tempArr = tempArr.filter((tempFile) => {
			if (tempFile.name !== file.name) return true;
		});
		setFiles(tempArr);
		setProgress((prevProgress) => {
			let tempProgress = { ...prevProgress };
			delete tempProgress[file.name];
			return tempProgress;
		});
		setHideUpload(false);
	};

	const handleFileChange = (e) => {
		try {
			if (!datasourceName) {
				setFormErrors((prev) => ({
					...prev,
					datasourceName: 'Please enter a name for your datasource',
				}));
			}
			if (
				dataSources.some((source) => source.name === datasourceName.trim())
			) {
				setFormErrors((prev) => ({
					...prev,
					datasourceName: 'Data source name already exists',
				}));
			}
			if (!e.target.files.length) return;
			const selectedFiles = Array.from(e.target.files);
			setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
			setProgress((prevProgress) => {
				const progessState = {};
				selectedFiles.forEach((file) => {
					progessState[file.name] = 0;
				});
				return { ...prevProgress, ...progessState };
			});
		} catch (error) {
			console.log(error);
		}
	};

	const uploadFileHelper = async () => {
		try {
			const filesToUpload = files.filter((file) => !file.url); // Filter out files with a URL

			if (filesToUpload.length === 0) {
				// toast.success('All files are already uploaded');
				return;
			}

			const uploadPromises = filesToUpload.map((file) =>
				uploadFile(file, setProgress, getToken()),
			);

			const uploadedData = await Promise.all(uploadPromises);

			// console.log('uploadedData===', uploadedData);

			const newFiles = files.map((file) => {
				const uploadedFile = uploadedData.find(
					(data) => data.name === file.name,
				);
				return {
					...file,
					url: uploadedFile ? uploadedFile.url : file.url || '',
					name: uploadedFile ? uploadedFile.name : file.name,
				};
			});

			setFiles(newFiles);
			toast.success('Files uploaded successfully');
		} catch (error) {
			setFiles([]);
			toast.error('Error uploading files');
			console.error('Error uploading files', error);
		}
	};
	const createDataSource = async () => {
		if (hideUpload && existingDatasourceId) {
			navigate(`/app/new-chat/?step=3&dataSourceId=${existingDatasourceId}`);
			return;
		}
		setIsLoading(true);
		const token = getToken();

		const data = {
			name: datasourceName,
			raw_files:
				Array.isArray(files) &&
				files.map((file) => ({
					file_name: file.name || file.file_name,
					file_id: uuid(),
					file_url: file.url || file.file_url,
				})),
			intent: [...dataSourceIntent],
		};

		try {
			const response = await createNewDtaSource(data, token);
			queryClient.invalidateQueries(['data-sources'], {
				refetchActive: true,
				refetchInactive: true,
			});
			toast.success('Data source created successfully');
			navigate(`/app/new-chat/?step=3&dataSourceId=${response.datasource_id}`);
			setProgress({});
			setIsLoading(false);
		} catch (error) {
			toast.error('Error creating data source');
			setIsLoading(false);
		}
	};
	const handleDeleteDataSource = async (e, dataSourceId) => {
		e.stopPropagation();
		try {
			const updatedList = utilReducer?.dataSources.filter((source) => {
				if (source.datasource_id !== dataSourceId) {
					return source;
				}
			});
			await deleteDataSource(dataSourceId, getToken());
			dispatch(updateUtilProp([{ key: 'dataSources', value: updatedList }]));
			setDataSources(updatedList);
		} catch (error) {}
	};

	const isAllFilesUploaded = () => {
		let filesPresent = Array.isArray(files) && files.length > 0;
		if (!filesPresent) return true;
		if (files.every((item) => item.file_url)) return true;
		if (Object.keys(progress).length === 0) return false;
		return Object.values(progress).every((value) => value === 100);
	};

	const checkIfExistingDatasourceUsed = () => {
		return hideUpload && existingDatasourceId;
	};

	const fetchDataSources = async () => {
		const token = getToken();
		const data = await getDataSources(token);
		return Array.isArray(data) ? data : [];
	};

	const { data, isLoading: isFetchingData } = useQuery({
		queryKey: ['data-sources'],
		queryFn: fetchDataSources,
	});

	const handleSelectUseCase = (value) => {
		if (dataSourceIntent.includes(value)) {
			setDataSourceIntent((prev) => prev.filter((item) => item !== value));
		} else {
			setDataSourceIntent((prev) => [...prev, value]);
		}
	};

	useEffect(() => {
		if (data?.length > 0) {
			setDataSources(data);
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		}
	}, [data]);

	useEffect(() => {
		if (files.length && !hideUpload) {
			uploadFileHelper();
		}
	}, [files.length, isLoading]);

	useEffect(() => {
		setFormErrors((prev) => ({
			...prev,
			datasourceName: '',
		}));
	}, [datasourceName]);

	useEffect(() => {
		const initialIntents = intent.slice(0, 5).map((item) => item.value);
		setDataSourceIntent(initialIntents);
	}, []);

	return (
		<div className="grid grid-cols-12 gap-4 pt-6">
			{/* Upload Section */}
			<div className="border rounded-3xl py-4 px-6 col-span-9 shadow-1xl h-fit">
				<div className="flex justify-between items-center">
					<h3 className="text-primary80 font-semibold text-xl">
						Connect your datasource
					</h3>
					{checkIfExistingDatasourceUsed() && (
						<div
							className="text-purple-100 text-sm font-medium cursor-pointer hover:opacity-80"
							onClick={() => {
								setHideUpload(false);
								setExistingDataSourceId(null);
								setFiles([]);
							}}
						>
							Create new datasource?
						</div>
					)}
				</div>
				<p className="text-primary40 text-sm">
					Securely connect to a data source
				</p>
				{!hideUpload && (
					<div className="mt-4 space-y-6 mb-10">
						<InputText
							label="Data Source Name"
							placeholder="Name your data source"
							value={datasourceName}
							setValue={(e) => setDatasourceName(e)}
							error={formErrors.datasourceName}
							errorText={formErrors.datasourceName}
							labelClassName="text-sm font-medium text-primary40"
						/>
						<div>
							<p className="text-sm font-medium text-primary40 mb-3">
								Choose Analysis Type
							</p>
							<div className="flex flex-wrap gap-2">
								{Array.isArray(intent) &&
									intent.map((useCase, index) => (
										<span
											key={useCase.value}
											onClick={() =>
												handleSelectUseCase(useCase.value)
											}
											className={`text-sm font-normal text-black/60 px-3 py-1.5 border border-black/10 rounded-[30px] cursor-pointer hover:bg-purple-8 hover:text-purple-100 ${
												dataSourceIntent.includes(
													useCase.value,
												)
													? 'bg-purple-8 text-purple-100 border-[1.2px] border-primary'
													: ''
											}`}
										>
											{useCase?.label}
										</span>
									))}
							</div>
						</div>
						<div
							className={` w-full bg-purple-4 hover:bg-purple-8 text-purple-100 text-sm font-medium hover:text-purple-100 rounded-lg ${
								!isAllFilesUploaded() || isLoading
									? 'cursor-not-allowed opacity-80'
									: 'cursor-pointer'
							}`}
							onClick={(e) => {
								e.preventDefault();
								if (!isAllFilesUploaded() || isLoading) return;
								inputRef.current.click();
							}}
						>
							<label
								htmlFor="file-upload"
								className=" block text-center cursor-pointer py-2 px-4"
							>
								Upload your Data Source
							</label>
						</div>
						<Input
							type="file"
							multiple
							ref={inputRef}
							className="absolute top-0 w-0 -z-1 opacity-0"
							onChange={(e) => handleFileChange(e)}
							id="file-upload"
							accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.binary.macroEnabled.12, .pdf"
						/>
					</div>
				)}
				{/* Render Files and their progress */}
				{Array.isArray(files) &&
					files?.map((file, idx) => (
						<div
							className="px-4 py-2.5 z-10 bg-purple-4 rounded-lg mt-2"
							key={file.name}
						>
							<div className="flex justify-between">
								<div className="flex gap-2 items-center">
									<img
										src={excel}
										alt="file-icon"
										className="size-6"
									/>
									<div className="text-sm text-purple-100 flex">
										{file.name || file.file_name}&nbsp;
										{file.size ? (
											<p className="text-sm font-medium text-primary80">{`(${formatFileSize(
												file?.size,
											)})`}</p>
										) : null}
									</div>
								</div>
								<div className="flex items-center text-sm font-medium">
									{(!hideUpload || file.url) &&
									progress[file.name] < 100 ? (
										<p className="mr-4">uploading...</p>
									) : null}
									<div
										onClick={() =>
											window.open(file.file_url, '_blank')
										}
										className="text-md px-2 py-1 rounded-md bg-purple-8 hover:bg-purple-8"
									>
										<i className="bi-download text-lg text-primary80  font-semibold cursor-pointer "></i>
									</div>
									{!checkIfExistingDatasourceUsed() &&
										file.url && (
											<div
												onClick={(e) =>
													handleRemoveFile(e, file, idx)
												}
												className="text-md px-2 py-1 rounded-md bg-purple-8  hover:bg-purple-8 ml-2"
											>
												<i className="bi-x text-xl text-primary80  font-semibold cursor-pointer"></i>
											</div>
										)}
								</div>
							</div>
							{(!hideUpload || file.url) &&
							progress[file.name] <= 99 ? (
								<div className="mt-4 h-2 w-full bg-gray-200 rounded-lg overflow-hidden">
									<div
										className="h-full bg-purple-100"
										style={{ width: `${progress[file.name]}%` }}
									></div>
								</div>
							) : null}
						</div>
					))}
				{/*  Start Querying Button */}
				{Array.isArray(files) && files?.length ? (
					<div className="mt-4">
						<Button
							className="w-full hover:bg-purple-100 hover:text-white hover:opacity-80"
							onClick={() => createDataSource()}
							disabled={isLoading || !isAllFilesUploaded()}
						>
							{isLoading ? (
								<i className="bi-arrow-repeat animate-spin mr-2"></i>
							) : null}
							Start Querying
						</Button>
					</div>
				) : null}
			</div>
			{/* Right Section Manage Data Source */}
			<div className="border rounded-3xl py-4 px-6 col-span-3 shadow-1xl max-h-[86vh] min-h-fit">
				<h3 className="text-primary80 font-semibold text-xl">
					Manage Data Source
				</h3>
				<p className="text-primary40 text-sm">
					Securely connect to a data source
				</p>
				<div className="mt-4 space-y-2 max-h-[90%] overflow-y-auto">
					{isFetchingData ? (
						<div className="flex items-center justify-center w-[14.84rem]">
							<i className="bi-arrow-repeat animate-spin text-primary80"></i>
						</div>
					) : dataSources.length ? (
						dataSources.map((source) => (
							<div
								className="flex justify-between items-center bg-purple-4 py-2 px-4 rounded-xl cursor-pointer"
								key={source.datasource_id}
								onClick={() => {
									setExistingDataSourceId(source.datasource_id);
									setHideUpload(true);
									setFiles(source?.raw_files || []);
								}}
							>
								<p className="text-primary80 font-medium max-w-[180px] truncate flex items-center">
									<img
										src="https://d2vkmtgu2mxkyq.cloudfront.net/database.svg"
										alt="database"
										className="mr-2 size-5"
									/>
									{source.name}
								</p>
								<i
									className="bi-trash text-primary80 text-sm cursor-pointer hover:bg-purple-8 rounded-md p-1"
									onClick={(e) =>
										handleDeleteDataSource(
											e,
											source.datasource_id,
										)
									}
								></i>
							</div>
						))
					) : (
						<p className="text-primary40 text-sm">
							No data sources found
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default Configuration;
