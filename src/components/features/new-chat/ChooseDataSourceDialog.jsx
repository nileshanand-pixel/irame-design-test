/* eslint-disable react/prop-types */
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { getDataSources } from '../configuration/service/configuration.service';
import { useNavigate } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useQuery } from '@tanstack/react-query';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

const ChooseDataSourceDialog = ({
	open,
	setOpen,
	setSelectedDataSource,
	selectedDataSource,
	handleNextStep,
}) => {
	const [dataSources, setDataSources] = useState([]);

	const navigate = useNavigate();

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);
	const [value, setValue] = useLocalStorage('dataSource');

	const handleSelect = () => {
		if (!selectedDataSource) return;

		const selectedDataSourceIndex = data?.findIndex(
			(item) => item.datasource_id === selectedDataSource,
		);
		const selectedDataSourceData = data[selectedDataSourceIndex];

		trackEvent(
			EVENTS_ENUM.SELECT_FROM_LIBRARY_CONTINUE_CLICKED,
			EVENTS_REGISTRY.SELECT_FROM_LIBRARY_CONTINUE_CLICKED,
			() => ({
				total_datasets_shown: dataSources.length,
				clicked_on: selectedDataSourceIndex + 1,
				dataset_id: selectedDataSource,
				dataset_name: selectedDataSourceData?.name,
			}),
		);
		navigate(
			`/app/new-chat/?step=3&dataSourceId=${selectedDataSource}&source=homepage`,
		);
		handleNextStep(3);
		setOpen(false);
	};
	const handleSelectedDS = (dataSourceId) => {
		setSelectedDataSource(dataSourceId);
		const dsName = data?.find(
			(item) => item.datasource_id === dataSourceId,
		)?.name;
		if (!dsName) return;
		dispatch(
			updateUtilProp([
				{
					key: 'selectedDataSource',
					value: { id: dataSourceId, name: dsName },
				},
			]),
		);
		// setValue((prev) => {
		// 	return {
		// 		...prev,
		// 		dataSourceId,
		// 		dataSourceName,
		// 	};
		// });
	};
	const fetchDataSources = async () => {
		const data = await getDataSources();
		return Array.isArray(data) ? data : [];
	};

	const { data, isLoading: dataSourceFetch } = useQuery({
		queryKey: ['data-sources'],
		queryFn: fetchDataSources,
	});

	useEffect(() => {
		if (data?.length > 0) {
			setDataSources(data);
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		}
	}, [data]);

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) {
					trackEvent(
						EVENTS_ENUM.SELECT_FROM_LIBRARY_CROSS_CLICKED,
						EVENTS_REGISTRY.SELECT_FROM_LIBRARY_CROSS_CLICKED,
					);
				}
				setOpen(value);
			}}
		>
			<DialogContent className="sm:max-w-[525px] ">
				<DialogHeader className="border-b pb-3">
					<DialogTitle>Choose Data Source</DialogTitle>
					<DialogDescription>
						You can always change it later from the data source page
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2 max-h-[30rem] overflow-auto">
					{dataSourceFetch && dataSources.length <= 0 ? (
						<div className="flex items-center justify-center">
							<i className="bi-arrow-repeat animate-spin text-primary80"></i>
						</div>
					) : dataSources?.length ? (
						<RadioGroup
							className="w-full"
							onValueChange={(value) => {
								handleSelectedDS(value);
							}}
						>
							{dataSources?.map((source) => {
								return (
									<div
										className="rounded-xl bg-purple-4 p-4 flex items-center gap-4"
										key={source.datasource_id}
									>
										<div className="flex items-center justify-between w-full space-x-2">
											<Label
												htmlFor={source.datasource_id}
												className="w-full flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-7 cursor-pointer"
											>
												<img
													src="https://d2vkmtgu2mxkyq.cloudfront.net/database.svg"
													alt="database"
													className="mr-2 size-6"
												/>
												{source.name}
											</Label>
											<RadioGroupItem
												id={source.datasource_id}
												value={source.datasource_id}
											/>
										</div>
									</div>
								);
								// </div>
							})}
						</RadioGroup>
					) : (
						<div className="flex flex-col items-center gap-2 justify-center h-40">
							<div className="text-primary40 text-sm">
								No data sources found
							</div>
							<Button
								onClick={() => {
									trackEvent(
										EVENTS_ENUM.SELECT_FROM_LIBRARY_UPLOAD_DATASET_CLICKED,
										EVENTS_REGISTRY.SELECT_FROM_LIBRARY_UPLOAD_DATASET_CLICKED,
									);
									setOpen(false);
									navigate('/app/configuration?source=qna');
								}}
								variant="outline"
								className="text-xs flex gap-2"
								size="sm"
							>
								<span class="material-symbols-outlined ">
									database_upload
								</span>
								Upload new dataset
							</Button>
						</div>
					)}
				</div>
				<DialogFooter className="w-full">
					<Button
						onClick={() => {
							trackEvent(
								EVENTS_ENUM.SELECT_FROM_LIBRARY_CANCEL_CLICKED,
								EVENTS_REGISTRY.SELECT_FROM_LIBRARY_CANCEL_CLICKED,
							);
							setOpen(false);
						}}
						variant="outline"
						className="rounded-lg w-full"
					>
						Cancel
					</Button>
					<Button
						onClick={() => handleSelect()}
						disabled={
							!selectedDataSource ||
							dataSourceFetch ||
							!data ||
							!data?.length
						}
						className="rounded-lg w-full hover:bg-purple-100 hover:text-white hover:opacity-80"
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ChooseDataSourceDialog;
