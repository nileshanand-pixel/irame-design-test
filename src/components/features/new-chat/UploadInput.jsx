import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { welcomeTypography } from './config';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import upperFirst from 'lodash.upperfirst';
import { getDataSourcesWithLimit } from '../configuration/service/configuration.service';
import DividerWithText from '@/components/elements/DividerWithText';
import { useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

const UploadInput = ({ progress, setOpen, handleNextStep }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	useEffect(() => {}, [progress]);

	const fetchDataSources = async () => {
		const data = await getDataSourcesWithLimit(3);
		return Array.isArray(data) ? data : [];
	};

	const { data: filteredList = [], isLoading: isFetchingData } = useQuery({
		queryKey: ['data-sources', 3],
		queryFn: fetchDataSources,
	});

	const handleDataSourceClick = (data, clickedOn) => {
		if (!data?.datasource_id) return;
		trackEvent(
			EVENTS_ENUM.RECENT_DATA_SOURCE_CLICKED,
			EVENTS_REGISTRY.RECENT_DATA_SOURCE_CLICKED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
				total_shown: filteredList.length,
				clicked_on: clickedOn,
			}),
		);
		navigate(
			`/app/new-chat/?step=3&dataSourceId=${data?.datasource_id}&source=homepage`,
		);
		handleNextStep(2);
		handleNextStep(3);
	};

	const handleSelectFromLibrary = (e) => {
		e.stopPropagation();
		setOpen(true);
	};

	const handleConnectDataSource = (e) => {
		e.stopPropagation();
		trackEvent(
			EVENTS_ENUM.CONNECT_DATA_SOURCE_CLICKED,
			EVENTS_REGISTRY.CONNECT_DATA_SOURCE_CLICKED,
		);
		navigate('/app/configuration?source=qna');
	};

	return (
		<div
			className={` flex flex-col border-dashed border-2 border-purple-24 bg-purple-2 py-6 rounded-2xl justify-center
			`}
		>
			<div className="flex flex-col w-full justify-center items-center gap-1 text-center ">
				<h2 className="text-4xl font-semibold text-primary80">
					{welcomeTypography?.subHeading1}
				</h2>
				<div className="flex gap-2 justify-center w-3/5 z-10 mt-10">
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
						onClick={(e) => {
							trackEvent(
								EVENTS_ENUM.SELECT_FROM_LIBRARY_CLICKED,
								EVENTS_REGISTRY.SELECT_FROM_LIBRARY_CLICKED,
							);
							handleSelectFromLibrary(e);
						}}
					>
						{welcomeTypography?.btn2Text}
					</Button>
				</div>
			</div>
			<DividerWithText
				text="OR"
				className="!w-3/5 mx-auto mt-6 mb-4 text-primary2"
			/>
			<div className="flex flex-col gap-2 px-4">
				<p className="text-sm text-primary80 font-medium">
					Recent Data Source
				</p>
				<div className="grid grid-cols-3 text-primary80 gap-6">
					{filteredList.length ? (
						filteredList.map((source, index) => (
							<div
								className="bg-purple-4 p-4 rounded-lg gap-4 cursor-pointer hover:bg-purple-8 transition-colors "
								key={source.datasource_id}
								onClick={() =>
									handleDataSourceClick(source, index + 1)
								}
							>
								<div className="flex items-center">
									<img
										src="https://d2vkmtgu2mxkyq.cloudfront.net/database.svg"
										alt="database"
										className="mr-2 size-6 text-primary40"
									/>
									<div className="flex flex-col items-start">
										<p className="text-base max-w-[12.5rem] truncate text-ellipsis">
											{upperFirst(source.name)}
										</p>
										<span className="text-primary40 text-xs">
											{new Date(
												source.created_at,
											).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											})}
										</span>
									</div>
								</div>
							</div>
						))
					) : (
						<p className="text-primary40 text-sm">
							{isFetchingData ? 'Loading...' : 'No data sources found'}
						</p>
					)}
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
