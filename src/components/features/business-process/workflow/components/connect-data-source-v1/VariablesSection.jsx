import React from 'react';
import Tooltip from '@/components/features/reports/components/Tooltip';
import upperFirst from 'lodash.upperfirst';

const VariablesSection = ({ variables, onVariablesChange }) => {
	// variables shape: { v1: {name, description, type, value}, v2: {...}, ... }
	const hasVariables = Object.keys(variables).length > 0;

	return (
		<div className="border-b pb-6">
			<h3 className="text-lg font-medium">Variables</h3>
			<div className="flex flex-wrap gap-4 space-y-3 mt-4 mx-2">
				{hasVariables ? (
					Object.entries(variables).map(([varKey, variable]) => (
						<div key={varKey} className="flex flex-col gap-2">
							<label className="font-medium w-fit">
								<Tooltip
									content={
										variable.description || 'No Description'
									}
								>
									{upperFirst(variable.name)}
								</Tooltip>
							</label>
							<input
								type="text"
								value={variable.value ?? ''}
								onChange={(e) =>
									onVariablesChange(varKey, e.target.value)
								}
								className="border p-2 rounded-md w-[200px]"
							/>
						</div>
					))
				) : (
					<div className="flex text-center w-full justify-center h-8 ">
						No variables available
					</div>
				)}
			</div>
		</div>
	);
};

export default VariablesSection;
