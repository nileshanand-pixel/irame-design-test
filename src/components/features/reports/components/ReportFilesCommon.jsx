import React from 'react';

export const FileCountChip = ({ count }) => {
	return (
		<span className="h-6 w-6 items-center flex justify-center rounded-full bg-purple-4 text-primary text-[0.65rem] font-medium">
			{count}
		</span>
	);
};

export const FilesDropdownHeader = ({ open, setOpen, displayReports }) => {
	return (
		<button
			// onClick={() => setOpen(!open)}
			className="cursor-default flex items-center gap-2 px-2 py-1 text-sm font-semibold text-primary40 w-full"
		>
			{/* {open ? <ChevronDown className="w-4 h-4 text-primary40" /> : <ChevronRight className="w-4 h-4 text-primary40" />} */}
			<span>Files</span>
			<FileCountChip count={displayReports.length} />
		</button>
	);
};

export default null;
