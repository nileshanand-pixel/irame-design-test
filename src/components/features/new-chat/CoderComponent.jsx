import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { trackEvent } from '@/lib/mixpanel';
import { Editor } from '@monaco-editor/react';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

const CoderComponent = ({ data }) => {
	const editorRef = useRef(null);
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const handleEditorDidMount = (editor) => {
		editorRef.current = editor;

		function handleEdit() {
			trackEvent(
				EVENTS_ENUM.CODER_EDIT_ATTEMPTED,
				EVENTS_REGISTRY.CODER_EDIT_ATTEMPTED,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: utilReducer?.selectedDataSource?.id,
					dataset_name: utilReducer?.selectedDataSource?.name,
					query_id: chatStoreReducer?.activeQueryId,
				}),
			);
		}

		editor.onKeyDown(handleEdit);
		editor.onDidPaste(handleEdit);
	};

	return (
		<div>
			<Editor
				height="68vh"
				theme="vs-dark"
				defaultLanguage="python"
				defaultValue={data || '# no data'}
				className="[&>.monaco-editor]:rounded-2xl bg-primary40"
				options={{ readOnly: true, readOnlyMessage: { value: 'Read Only' } }}
				onMount={handleEditorDidMount}
			/>
		</div>
	);
};

export default CoderComponent;
