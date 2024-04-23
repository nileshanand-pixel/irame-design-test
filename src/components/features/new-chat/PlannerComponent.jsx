import React from 'react';

const PlannerComponent = () => {
	return (
		<div className="border rounded-2xl py-4 px-4 col-span-4 text-primary80 font-medium h-fit">
			<div className="my-4">
				<h3 className="text-primary100 font-medium">
					{key.charAt(0).toUpperCase() + key.slice(1)}
				</h3>
				<p className="text-primary80">{value.tool_data}</p>
			</div>
		</div>
	);
};

export default PlannerComponent;
