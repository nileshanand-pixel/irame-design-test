import { useRouter } from '@/hooks/useRouter';
import React from 'react';

const DataSourceCard = ({data}) => {
    const { navigate } = useRouter();
	return (
		<div onClick={() => navigate(`/app/reports/datasources/report?datasourceId=${data.datasource_id}`)} className={`flex gap-2 cursor-pointer p-4 border rounded-2xl border-primary10 ${data.datasource_id === 'shared' && 'bg-primary2'} hover:bg-gray-100`}>
			<img
				src="https://d2vkmtgu2mxkyq.cloudfront.net/folder_image_icon.png"
				alt="folder icon"
				className="mr-2 w-16"
			/>
			<div className='flex flex-col gap-2 mr-4'>
				<span className='text-base font-semibold truncate md:max-w-40 xl:max-w-52 xl:pr-8 text-primary80'>{data?.datasource_name}</span>
				<div className='px-2 py-0.5 w-fit rounded-2xl text-secondary-textPurple bg-secondary-lightPurple'>{data?.report_count || 0} Reports</div>
			</div>
		</div>
	);
};

export default DataSourceCard;
