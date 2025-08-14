import { useRouter } from '@/hooks/useRouter';
import React from 'react';

const DataSourceCard = ({ data }) => {
	const { navigate } = useRouter();
	return (
		<div
			onClick={() =>
				navigate(
					`/app/reports/datasources/report?datasourceId=${data.datasource_id}`,
				)
			}
			className={`flex gap-4 cursor-pointer p-4 border rounded-2xl border-primary10 ${data.datasource_id === 'shared' && 'bg-primary2'} hover:bg-gray-100`}
		>
			<img
				src="https://d2vkmtgu2mxkyq.cloudfront.net/folder_image_icon.png"
				alt="folder icon"
				className="w-[3.81rem]"
			/>
			<div className="w-[calc(100%-4.81rem)] flex flex-col gap-2">
				<div className="w-full text-sm font-semibold truncate text-primary80">
					{data?.datasource_name}
				</div>
				<div className="px-2 py-0.5 w-fit rounded-2xl text-secondary-textPurple bg-secondary-lightPurple">
					{data?.report_count || 0} Reports
				</div>
			</div>
		</div>
	);
};

export default DataSourceCard;
