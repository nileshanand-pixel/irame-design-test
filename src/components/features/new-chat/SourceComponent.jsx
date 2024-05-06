import React from 'react';

const SourceComponent = ({ data }) => {
	// console.log(data, 'source');

	const toolData =
		data?.tool_data && typeof data?.tool_data === 'string'
			? JSON.parse(data?.tool_data)
			: data?.tool_data;
	return (
		<div className="border rounded-2xl py-4 px-4 col-span-4 text-primary80 font-medium h-fit">
			<div className="my-4">
				<h3 className="text-primary100 font-medium">
					{/* {data.charAt(0).toUpperCase() + data.slice(1)} */}
				</h3>
				{toolData
					? Object.keys(toolData || {}).map((fileName, index) => (
							<div
								key={index}
								className="mb-4 border border-purple-4 rounded-2xl p-4 bg-purple-2"
							>
								<h3 className="text-primary60 font-semibold ">
									{fileName}
								</h3>
								<div className="flex flex-wrap gap-2 mt-6">
									{toolData[fileName].Columns_Used.map(
										(column, i) => (
											<div
												key={i}
												className="flex justify-center px-2 py-1 text-sm bg-purple-4 rounded-[100px] max-w-fit min-w-10"
											>
												{column}
											</div>
										),
									)}
								</div>
							</div>
					  ))
					: null}
			</div>
		</div>
	);
};

export default SourceComponent;
