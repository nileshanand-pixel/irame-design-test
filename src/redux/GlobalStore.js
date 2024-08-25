import { configureStore } from '@reduxjs/toolkit';
import utilReducer, { resetUtil } from './reducer/utilReducer';
import chatStoreReducer, { resetChatStore } from './reducer/chatReducer.js';
import reportReducer, { resetReportStore } from './reducer/reportReducer';

const reduxStore = configureStore({
	reducer: {
		utilReducer: utilReducer,
		chatStoreReducer: chatStoreReducer,
		reportStoreReducer: reportReducer,
	},
});

/ * whenever add new slice, add reset method here. */;
export const resetAllStores = () => {
	reduxStore.dispatch(resetChatStore());
	reduxStore.dispatch(resetUtil());
	reduxStore.dispatch(resetReportStore());
};

export default reduxStore;
