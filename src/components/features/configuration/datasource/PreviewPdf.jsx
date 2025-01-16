import React, { useState, useRef, useEffect } from 'react';

const PreviewPdf = ({ url }) => {
	const iframeRef = useRef(null);
	return (
		<div className="flex flex-col items-center w-full">
			{/* PDF Viewer */}
			<div ref={iframeRef} className="w-full h-screen mb-4">
				<iframe
					ref={iframeRef}
					src={`${url}#page=1`}
					width="100%"
					height="100%"
					className="shadow-lg border rounded-lg"
					title="PDF Viewer"
				/>
			</div>
		</div>
	);
};

export default PreviewPdf;
