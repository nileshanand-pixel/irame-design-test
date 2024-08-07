import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';

const PlannerComponent = ({ data }) => {
	const [segments, setSegments] = useState([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editIndex, setEditIndex] = useState(null);
	const [editContent, setEditContent] = useState('');
	const editRef = useRef(null);

	// Initialize segments from data
	useEffect(() => {
		if (data && data?.tool_data?.text) {
			const rawSegments = data.tool_data.text.replace(/\\n/g, '\n').split('<slice/>');
			setSegments(rawSegments.map((segment) => DOMPurify.sanitize(segment.trim())));
		}
	}, [data]);

	const handleEdit = (index) => {
		setIsEditing(true);
		setEditIndex(index);
		setEditContent(segments[index]);
	};

	const handleSave = () => {
		const updatedSegments = [...segments];
		updatedSegments[editIndex] = DOMPurify.sanitize(editRef.current.innerHTML);
		setSegments(updatedSegments);
		setIsEditing(false);
		setEditIndex(null);
		setEditContent('');
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditIndex(null);
		setEditContent('');
	};
    

	return (
		<div className="my-4 col-span-4 max-h-[80%] overflow-y-auto space-y-4">
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
									>
										Save
									</Button>
								</div>
							</>
						) : (
							<div>
								<div dangerouslySetInnerHTML={{ __html: segment }}></div>
								<Button
									variant="outline"
									className="text-sm mt-2 font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
									onClick={() => handleEdit(index)}
									disabled = {isEditing && editIndex !== index}
								>
									Edit
								</Button>
							</div>
						)}
					</div>
				))
			) : (
				<div className="text-primary80 border rounded-2xl py-4 px-4 font-medium my-2">
					No content available.
				</div>
			)}
		</div>
	);
};

export default PlannerComponent;
