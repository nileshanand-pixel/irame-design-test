import React from 'react';

const SourceComponent = ({ data }) => {
	console.log(data, 'source');
	return (
		<div className="border rounded-2xl py-4 px-4 col-span-4 text-primary80 font-medium h-fit">
			<div className="my-4">
				<h3 className="text-primary100 font-medium">
					{/* {data.charAt(0).toUpperCase() + data.slice(1)} */}
				</h3>
				{data?.tool_data ? (
					<div
						className="text-primary80"
						style={{ whiteSpace: 'pre-wrap' }}
					>
						{data?.tool_data}
					</div>
				) : null}
			</div>
		</div>
	);
};

export default SourceComponent;
