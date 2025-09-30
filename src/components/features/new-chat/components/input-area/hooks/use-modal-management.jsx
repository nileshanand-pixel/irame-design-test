import { useState, useLayoutEffect } from 'react';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';

export const useModalManagement = (setMode) => {
	const [showModal, setShowModal] = useState(false);
	const [secondaryModalData, setSecondaryModalData] = useState({
		isVisible: false,
		id: '',
	});
	const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

	const resetSecondaryModalData = () => {
		setSecondaryModalData({ id: '', isVisible: false });
	};

	const handleActionSelect = (actionId, setMode, resetSecondaryModalData) => {
		try {
			switch (actionId) {
				case 'queryInBulk':
					setMode('bulk');
					break;
				case 'workflowQuery':
					setMode('workflow');
					break;
				case 'savedQueries':
					setSecondaryModalData((prev) => ({
						...prev,
						id: 'savedQueries-secondaryModal',
						isVisible: !prev.isVisible,
					}));
					return;
				default:
					break;
			}
			setShowModal(false);
			resetSecondaryModalData();
		} catch (error) {
			logError(error, { feature: 'chat', action: 'modal-action' });
			toast.error("Couldn't process that action. Please try again.");
		}
	};

	return {
		showModal,
		setShowModal,
		secondaryModalData,
		setSecondaryModalData,
		modalPosition,
		setModalPosition,
		resetSecondaryModalData,
		handleActionSelect: (actionId) =>
			handleActionSelect(actionId, setMode, resetSecondaryModalData),
	};
};
