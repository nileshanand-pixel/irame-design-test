import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { trackEvent } from '@/lib/mixpanel';
import { Editor } from '@monaco-editor/react';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const CoderComponent = ({ data }) => {
	const [fontSize, setFontSize] = useState(0);
	const editorRef = useRef(null);
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const { data: datasourceData } = useDatasourceDetailsV2();
	const handleEditorDidMount = (editor) => {
		editorRef.current = editor;

		function handleEdit() {
			trackEvent(
				EVENTS_ENUM.CODER_EDIT_ATTEMPTED,
				EVENTS_REGISTRY.CODER_EDIT_ATTEMPTED,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: chatStoreReducer?.activeQueryId,
				}),
			);
		}

		editor.onKeyDown(handleEdit);
		editor.onDidPaste(handleEdit);
	};

	useEffect(() => {
		function handleResize() {
			setFontSize(
				parseFloat(
					window.getComputedStyle(document.documentElement).fontSize,
				),
			);
		}
		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return (
		<Editor
			height="100%"
			theme="vs-dark"
			defaultLanguage="python"
			defaultValue={data || '# no data'}
			className="[&>.monaco-editor]:rounded-2xl bg-primary40 h-full"
			options={{
				readOnly: true,
				readOnlyMessage: { value: 'Read Only' },
				fontSize,
				renderMiniMap: 'None',
				glyphMargin: false,
				minimap: { enabled: false },
			}}
			onMount={handleEditorDidMount}
		/>
	);
};

export default CoderComponent;
