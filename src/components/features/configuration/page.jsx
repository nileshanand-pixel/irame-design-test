import InputText from '@/components/elements/InputText';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn, formatFileSize, getToken, tokenCookie } from '@/lib/utils';
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
import Cookies from 'js-cookie';
import { v4 as uuid } from 'uuid';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';

const Configuration = () => {
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(0);
	const [datasourceName, setDatasourceName] = useState('');
	const [formErrors, setFormErrors] = useState({});
	const [dataSources, setDataSources] = useState([]);
	const [showNoUpload, setShowNoUpload] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [dataSourceFetch, setDataSourceFetch] = useState(false);

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);

	const { navigate } = useRouter();

	const inputRef = useRef();

	const handleRemoveFile = (e, file, idx) => {
		e.preventDefault();
		e.stopPropagation();
		let tempArr = [...files];
		tempArr.splice(idx, 1);
		setFiles(tempArr);
		setShowNoUpload(false);
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

			const newFiles = files.map((file) => {
				const uploadedFile = uploadedData.find(
					(data) => data.name === file.name,
				);
				return {
					...file,
					url: uploadedFile ? uploadedFile.url : '',
				};
			});

			setFiles(newFiles);
			toast.success('Files uploaded successfully');
		} catch (error) {
			setFiles([]);
			toast.error('Error uploading files');
			console.error('Error uploading files', error);
		} finally {
			setProgress(0);
		}
	};
	const createDataSource = async () => {
		setIsLoading(true);
		const token = getToken();

		const data = {
			name: datasourceName,
			filepath:
				Array.isArray(files) &&
				files.map((file) => ({
					file_name: file.name,
					file_id: uuid(),
					file_url: file.url,
				})),
		};

		try {
			const response = await createNewDtaSource(data, token);
			toast.success('Data source created successfully');
			navigate(`/app/new-chat/?step=3&dataSourceId=${response.datasource_id}`);
		} catch (error) {
			toast.error('Error creating data source');
		} finally {
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

	useEffect(() => {
		const fetchDataSources = async () => {
			setDataSourceFetch(true);
			const token = getToken();
			if (utilReducer.dataSources.length > 0) {
				setDataSources(utilReducer.dataSources);
				setDataSourceFetch(false);
				return;
			}
			const data = await getDataSources(token);
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
			setDataSources(Array.isArray(data) ? data : []);
			setDataSourceFetch(false);
		};

		fetchDataSources();
	}, [files]);

	useEffect(() => {
		if (files.length && !showNoUpload) {
			uploadFileHelper();
		}
	}, [files.length]);

	useEffect(() => {
		setFormErrors((prev) => ({
			...prev,
			datasourceName: '',
		}));
	}, [datasourceName]);

	return (
		<div className="grid grid-cols-12 gap-4 pt-6">
			<div className="border rounded-3xl py-4 px-6 col-span-9 shadow-1xl h-fit">
				<h3 className="text-primary80 font-semibold text-xl">
					Connect your datasource
				</h3>
				<p className="text-primary40 text-sm">
					Securely connect to a data source
				</p>
				{!showNoUpload && (
					<div className="mt-4 space-y-2 mb-10">
						<InputText
							placeholder="Name your data source"
							value={datasourceName}
							setValue={(e) => setDatasourceName(e)}
							error={formErrors.datasourceName}
							errorText={formErrors.datasourceName}
						/>
						<div
							className={` w-full bg-purple-4 hover:bg-purple-8 text-purple-100 text-sm font-medium hover:text-purple-100 rounded-lg ${
								(progress > 0 && progress < 100) || isLoading
									? 'cursor-not-allowed opacity-80'
									: 'cursor-pointer'
							}`}
							onClick={(e) => {
								e.preventDefault();
								if ((progress > 0 && progress < 100) || isLoading)
									return;
								inputRef.current.click();
							}}
						>
							<label
								htmlFor="file-upload"
								className=" block text-center cursor-pointer py-2 px-4"
							>
								Upload your files
							</label>
						</div>
						<Input
							type="file"
							multiple
							ref={inputRef}
							className="absolute top-0 w-0 -z-1 opacity-0"
							onChange={(e) => handleFileChange(e)}
							id="file-upload"
							accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.binary.macroEnabled.12"
						/>
					</div>
				)}
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
									{(!showNoUpload || file.url) &&
									progress < 100 ? (
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
									<div
										onClick={(e) =>
											handleRemoveFile(e, file, idx)
										}
										className="text-md px-2 py-1 rounded-md bg-purple-8  hover:bg-purple-8 ml-2"
									>
										<i className="bi-x text-xl text-primary80  font-semibold cursor-pointer"></i>
									</div>
								</div>
							</div>
							{(!showNoUpload || file.url) && progress <= 99 ? (
								<div className="mt-4 h-2 w-full bg-gray-200 rounded-lg overflow-hidden">
									<div
										className="h-full bg-purple-100"
										style={{ width: `${progress}%` }}
									></div>
								</div>
							) : null}
						</div>
					))}
				{!showNoUpload &&
				Array.isArray(files) &&
				files?.length &&
				progress === 100 ? (
					<div className="mt-4">
						<Button
							className="w-full hover:bg-purple-100 hover:text-white hover:opacity-80"
							onClick={() => createDataSource()}
							disabled={isLoading || progress < 100}
						>
							{isLoading ? (
								<i className="bi-arrow-repeat animate-spin mr-2"></i>
							) : null}
							Start Querying
						</Button>
					</div>
				) : null}
			</div>
			<div className="border rounded-3xl py-4 px-6 col-span-3 shadow-1xl max-h-[86vh] min-h-fit">
				<h3 className="text-primary80 font-semibold text-xl">
					Manage Data Source
				</h3>
				<p className="text-primary40 text-sm">
					Securely connect to a data source
				</p>
				<div className="mt-4 space-y-2 max-h-[90%] overflow-y-auto">
					{dataSourceFetch ? (
						<div className="flex items-center justify-center">
							<i className="bi-arrow-repeat animate-spin text-primary80"></i>
						</div>
					) : dataSources.length ? (
						dataSources.map((source) => (
							<div
								className="flex justify-between items-center bg-purple-4 py-2 px-4 rounded-xl cursor-pointer"
								key={source.datasource_id}
								onClick={() => {
									setShowNoUpload(true);
									setFiles(source.filepath);
								}}
							>
								<p className="text-primary80 font-medium max-w-[180px] truncate">
									<i className="bi-database mr-2 text-primary80 text-md "></i>
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
