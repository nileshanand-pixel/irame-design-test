import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getToken } from '@/lib/utils';
import AddQueryToNewReportDialog from './AddQueryToNewReportDialog';
import AddQueryToReportDialog from './AddQueryToReportDialog';
import ChooseReportDialog from './ChooseReportDialog';

function AddQueryFlow({ isOpen, onClose }) {
	const token = getToken();
	const queryId = useSelector((state) => state.chatStoreReducer.activeQueryId);

	const [addQueryOpen, setAddQueryOpen] = useState(false);
	const [createReportOpen, setCreateReportOpen] = useState(false);
	const [selectedReport, setSelectedReport] = useState(null);

	const handleAddNewReport = () => {
		setCreateReportOpen(true);
	};

	const handleContinue = (report) => {
		setSelectedReport(report);
		setAddQueryOpen(true);
	};

	const handleSuccessCloseAll = () => {
		resetStates();
		onClose();
	};

	const resetStates = () => {
		setAddQueryOpen(false);
		setCreateReportOpen(false);
		setSelectedReport(null);
	};

	useEffect(() => {
		if (!isOpen) {
			resetStates();
		}
	}, [isOpen]);

	return (
		<>
			<ChooseReportDialog
				open={isOpen && !addQueryOpen && !createReportOpen}
				onClose={() => {
					resetStates();
					onClose();
				}}
				onAddNewReport={handleAddNewReport}
				onContinue={handleContinue}
				token={token}
			/>

			<AddQueryToReportDialog
				open={addQueryOpen}
				onClose={() => setAddQueryOpen(false)}
				token={token}
				report={selectedReport}
				queryId={queryId}
				onSuccessCloseAll={handleSuccessCloseAll}
			/>

			<AddQueryToNewReportDialog
				open={createReportOpen}
				onClose={() => setCreateReportOpen(false)}
				token={token}
				queryId={queryId}
				onSuccessCloseAll={handleSuccessCloseAll}
			/>
		</>
	);
}

export default AddQueryFlow;
