import { Editor } from '@monaco-editor/react';
import React from 'react';

const CoderComponent = ({ data }) => {
	return (
		<div>
			<Editor
				height="68vh"
				theme="vs-dark"
				defaultLanguage="python"
				defaultValue={data || '# no data'}
				className="[&>.monaco-editor]:rounded-2xl bg-primary40"
				options={{readOnly: true, readOnlyMessage: { value: 'Read Only' }}}
			/>
		</div>
	);
};

export default CoderComponent;
