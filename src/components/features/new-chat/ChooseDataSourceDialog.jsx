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
import Cookies from 'js-cookie';
import { tokenCookie, getToken } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { queryClient } from '@/lib/react-query';
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
		trackEvent(EVENTS_ENUM.CHAT_SESSION_STARTED, EVENTS_REGISTRY.CHAT_SESSION_STARTED, () => ({
			datasource_id: selectedDataSource
		}))
		navigate(`/app/new-chat/?step=3&dataSourceId=${selectedDataSource}`);
		handleNextStep(3);
		setOpen(false);
	};
	const handleSelectedDS = (dataSourceId, dataSourceName) => {
		setSelectedDataSource(dataSourceId);
		dispatch(
			updateUtilProp([
				{
					key: 'selectedDataSource',
					value: { id: dataSourceId, name: dataSourceName },
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
		const token = getToken();
		const data = await getDataSources(token);
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
		<Dialog open={open} onOpenChange={setOpen}>
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
						dataSources?.map((source) => {
							return (
								<div
									className="rounded-xl bg-purple-4 p-4 flex items-center gap-4"
									key={source.datasource_id}
								>
									<RadioGroup
										className="w-full"
										onClick={() => {
											handleSelectedDS(
												source.datasource_id,
												source.name,
											);
										}}
									>
										<div className="flex items-center justify-between space-x-2">
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
												value={selectedDataSource}
												id={source.datasource_id}
											/>
										</div>
									</RadioGroup>
								</div>
							);
							// </div>
						})
					) : (
						<p className="text-primary40 text-sm">
							No data sources found
						</p>
					)}
				</div>
				<DialogFooter className="w-full">
					<Button
						onClick={() => setOpen(false)}
						variant="outline"
						className="rounded-lg w-full"
					>
						Cancel
					</Button>
					<Button
						onClick={() => handleSelect()}
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
