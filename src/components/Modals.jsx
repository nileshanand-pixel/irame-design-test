import React from 'react';
import { useSelector } from 'react-redux';
import CreateReportModal from './features/reports/components/CreateReportModal';
import ShareReportDialog from './features/reports/components/ShareReportDialog';

const Modals = () => {
	const modalState = useSelector((state) => state.modalReducer);

	return (
		<>
			{modalState.createReport && <CreateReportModal />}
			{modalState.shareReport && <ShareReportDialog />}
		</>
	);
};

export default Modals;
