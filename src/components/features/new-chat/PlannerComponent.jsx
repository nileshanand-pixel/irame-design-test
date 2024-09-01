import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';

const PlannerComponent = ({ data }) => {
	let segments = [];
	if (data && data.tool_data) {
		const rawSegments = data.tool_data.text.replace(/\\n/g, '\n').split('<slice/>');
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
				<div className="flex flex-col space-y-3">
					<div className="space-y-2">
						<Skeleton className="h-5 w-[50%] bg-purple-8" />
						<Skeleton className="h-5 w-[90%] bg-purple-8" />
					</div>
					<Skeleton className="h-[125px] w-[250px] rounded-xl bg-purple-8" />
				</div>
			)}
		</div>
	);
};

export default PlannerComponent;
