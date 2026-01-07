import clarificationIcon from '@/assets/icons/clarification.svg';
import Text from './components/text';
import { useMemo } from 'react';
import SingleChoice from './components/single-choice';
import OutputColumns from './components/output-columns';

export const CLARIFICATION_TYPE = {
	TEXT: 'text',
	SINGLE_CHOICE: 'single_choice',
	OUTPUT_COLUMNS: 'output_columns',
};

const CLARIFICATION_COMPONENTS_MAP = {
	[CLARIFICATION_TYPE.TEXT]: Text,
	[CLARIFICATION_TYPE.SINGLE_CHOICE]: SingleChoice,
	[CLARIFICATION_TYPE.OUTPUT_COLUMNS]: OutputColumns,
};

const Clarification = ({ data, addClarificationQuery, canClarify }) => {
	const Component =
		CLARIFICATION_COMPONENTS_MAP[
			data?.tool_data?.type || CLARIFICATION_TYPE.TEXT
		];

	return (
		<div className="border-2 border-[#F9E9D7] rounded-2xl w-[90%] py-4 px-6">
			<div className="flex items-center gap-4 mb-6">
				<img src={clarificationIcon} className="size-10" />
				<div className="text-[#DB7707] font-semibold">Clarification</div>
			</div>

			{Component && (
				<Component
					data={data}
					addClarificationQuery={addClarificationQuery}
					canClarify={canClarify}
				/>
			)}
		</div>
	);
};

export default Clarification;
