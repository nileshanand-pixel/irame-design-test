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
import { useNavigate } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useDataSources } from '@/hooks/useDataSources';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import redirectIcon from '@/assets/icons/redirect.svg';

const ChooseDataSourceDialog = ({
	open,
	setOpen,
	setSelectedDataSource,
	selectedDataSource,
}) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const handleSelect = () => {
		if (!selectedDataSource) return;

		const selectedDataSourceIndex = dataSources?.findIndex(
			(item) => item.datasource_id === selectedDataSource,
		);
		const selectedDataSourceData = dataSources[selectedDataSourceIndex];

		trackEvent(
			EVENTS_ENUM.SELECT_FROM_LIBRARY_CONTINUE_CLICKED,
			EVENTS_REGISTRY.SELECT_FROM_LIBRARY_CONTINUE_CLICKED,
			() => ({
				total_datasets_shown: dataSources?.length || 0,
				clicked_on: selectedDataSourceIndex + 1,
				dataset_id: selectedDataSource,
				dataset_name: selectedDataSourceData?.name,
			}),
		);
		navigate(
			`/app/new-chat/?step=3&datasource_id=${selectedDataSource}&source=homepage`,
		);
		setOpen(false);
	};
	const handleSelectedDS = (dataSourceId) => {
		setSelectedDataSource(dataSourceId);
		const dsName = dataSources?.find(
			(item) => item.datasource_id === dataSourceId,
		)?.name;
		if (!dsName) return;
		// setValue((prev) => {
		// 	return {
		// 		...prev,
		// 		dataSourceId,
		// 		dataSourceName,
		// 	};
		// });
	};
	// Use custom hook that handles team-based caching properly
	const {
		dataSources,
		isLoading: dataSourceFetch,
		Sentinel,
		isFetchingNextPage,
	} = useDataSources({
		search: debouncedSearch || undefined,
	});

	const dataToShow = dataSources || [];

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				setOpen(value);
			}}
		>
			<DialogContent className="max-w-[40%] ">
				<DialogHeader className="border-b pb-3">
					<DialogTitle className="">Choose Data Source</DialogTitle>
					<DialogDescription>
						You can always change it later from the data source page
					</DialogDescription>
				</DialogHeader>
				<div>
					<div className="flex items-center border rounded-lg h-11 pl-4 pr-6 transition-width duration-300">
						<i className="bi-search text-primary40 me-2"></i>
						<Input
							placeholder="Search"
							className={cn(
								'border-none rounded-sm px-0 font-medium bg-transparent',
							)}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<Button
						size="sm"
						variant="outline"
						className="mt-4 rounded-lg flex gap-2 !text-[#26064ACC] border border-[#26064ACC]"
						onClick={() => {
							navigate('/app/configuration');
							setOpen(false);
						}}
					>
						<span>Configure New Data Set</span>
						<img src={redirectIcon} alt="redirect" className="size-4" />
					</Button>
				</div>
				<div className="space-y-2 h-[50vh] overflow-auto">
					{dataSourceFetch && dataToShow.length <= 0 ? (
						<div className="flex items-center justify-center">
							<i className="bi-arrow-repeat animate-spin text-primary80"></i>
						</div>
					) : dataToShow?.length ? (
						<>
							<RadioGroup
								className="w-full"
								onValueChange={(value) => {
									handleSelectedDS(value);
								}}
							>
								{dataToShow?.map((source) => {
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
								})}
							</RadioGroup>
							{Sentinel && <Sentinel />}
							{isFetchingNextPage && (
								<div className="flex items-center justify-center py-2">
									<i className="bi-arrow-repeat animate-spin text-primary80"></i>
								</div>
							)}
						</>
					) : (
						<div className="flex flex-col items-center gap-2 justify-center h-40">
							<div className="text-primary40 text-sm">
								No data sources found
							</div>
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
							!dataSources ||
							!dataSources?.length
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
