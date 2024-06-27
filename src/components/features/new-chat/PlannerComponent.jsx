import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';

const PlannerComponent = ({ data }) => {
	let segments = [];
	if (data && data.tool_data) {
		const rawSegments = data.tool_data.replace(/\\n/g, '\n').split('<slice/>');
		segments = rawSegments.map((segment) => DOMPurify.sanitize(segment.trim()));
	}

	return (
		<div className="my-4 col-span-4 max-h-[80%] overflow-y-auto space-y-4">
			{segments.length > 0 ? (
				segments.map((segment, index) => (
					<div
						key={index}
						className="text-primary80 border rounded-2xl py-4 px-4 font-medium my-2 w-full truncate"
						style={{ whiteSpace: 'pre-wrap' }}
						dangerouslySetInnerHTML={{ __html: segment }}
					></div>
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
