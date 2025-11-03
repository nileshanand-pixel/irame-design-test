import React, { useState, useEffect, useRef, useContext } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { EditContext } from './components/WorkspaceEditProvider';
import { useSelector } from 'react-redux';
import { Skeleton } from '@/components/ui/skeleton';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

const plannerTitles = [
	'Question Interpretation',
	'Data Availability',
	'Data Processing Steps',
];

const PlannerComponent = ({
	data,
	canEdit,
	workspaceHasChanges,
	setWorkspaceHasChanges,
	queryId,
}) => {
	const { query } = useRouter();
	const { segments, setSegments, changeSets, setChangesets, editDisabled } =
		useContext(EditContext);
	const [isEditing, setIsEditing] = useState(false);
	const [editIndex, setEditIndex] = useState(null);
	const [editContent, setEditContent] = useState('');
	const [enableSaveButton, setEnableSaveButton] = useState(false);
	const editRef = useRef(null);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const utilReducer = useSelector((state) => state.utilReducer);

	const setInitialSegments = () => {
		if (!data?.tool_data?.text) return;
		const rawSegments = data.tool_data.text
			.replace(/\\n/g, '\n')
			.split('<slice/>');
		setSegments(
			rawSegments.map((segment) => DOMPurify.sanitize(segment.trim())),
		);
	};

	const { data: datasourceData } = useDatasourceDetailsV2();
	// Initialize segments from data
	useEffect(() => {
		if (!workspaceHasChanges) setInitialSegments();
	}, [data]);

	useEffect(() => {
		if (workspaceHasChanges) return;
		setInitialSegments();
	}, [queryId]);

	const handleEdit = (index) => {
		setIsEditing(true);
		setEditIndex(index);
		setEditContent(segments[index]);
		setChangesets({ ...changeSets, planner: true });
		let editedTitle = '';
		for (const title of plannerTitles) {
			if (segments[index].includes(title)) {
				editedTitle = title;
				break;
			}
		}
	};

	const handleSave = () => {
		setWorkspaceHasChanges(true);
		const updatedSegments = [...segments];
		updatedSegments[editIndex] = DOMPurify.sanitize(editRef.current.innerHTML);
		setSegments(updatedSegments);
		setIsEditing(false);
		setEditIndex(null);
		setEditContent('');

		trackEvent(
			EVENTS_ENUM.PLANNER_EDITED,
			EVENTS_REGISTRY.PLANNER_EDITED,
			() => ({
				chat_session_id: query.sessionId,
				dataset_id: datasourceData?.datasource_id,
				dataset_name: datasourceData?.name,
				query_id: queryId,
				type_change: [
					...editRef.current.innerHTML.matchAll(/<b>(.*?)<\/b>/g),
				]?.[0]?.[1],
			}),
		);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditIndex(null);
		setEditContent('');
	};

	return (
		<div className="my-4 w-full pr-4 overflow-y-auto space-y-4">
			{segments.length > 0 ? (
				segments.map((segment, index) => (
					<div
						key={index}
						className="text-primary80 border rounded-2xl py-4 px-4 font-medium my-2 w-full"
						style={{ whiteSpace: 'pre-wrap' }}
					>
						{isEditing && editIndex === index ? (
							<>
								<div
									onInput={() => setEnableSaveButton(true)}
									ref={editRef}
									contentEditable
									dangerouslySetInnerHTML={{ __html: editContent }}
								></div>
								<div className="mt-2 flex gap-4">
									<Button
										variant="outline"
										className="text-sm font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
										onClick={handleCancel}
									>
										Cancel
									</Button>
									<Button
										className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
										onClick={handleSave}
										disabled={!enableSaveButton}
									>
										Save
									</Button>
								</div>
							</>
						) : (
							<div>
								<div
									dangerouslySetInnerHTML={{ __html: segment }}
								></div>
								{canEdit && (
									<Button
										variant="outline"
										className="text-sm mt-2 font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
										onClick={() => handleEdit(index)}
										disabled={
											isEditing &&
											editIndex !== index &&
											editDisabled
										}
									>
										Edit
									</Button>
								)}
							</div>
						)}
					</div>
				))
			) : (
				<div className="flex flex-col space-y-3">
					<div className="space-y-2">
						<Skeleton className="h-5 w-[50%] bg-purple-8" />
						<Skeleton className="h-5 w-[90%] bg-purple-8" />
					</div>
					<Skeleton className="h-[7.8rem] w-[15.625rem] rounded-xl bg-purple-8" />
				</div>
			)}
		</div>
	);
};

export default PlannerComponent;
