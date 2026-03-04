import React from 'react';
import { useRbac } from '@/hooks/useRbac';
import ShareReportDialogRBAC from './ShareReportDialogRBAC';
import ShareReportDialogLegacy from './ShareReportDialogLegacy';

const ShareReportDialog = React.memo(() => {
	const { isRbacActive } = useRbac();

	if (isRbacActive) {
		return <ShareReportDialogRBAC />;
	}

	return <ShareReportDialogLegacy />;
});

export default ShareReportDialog;
