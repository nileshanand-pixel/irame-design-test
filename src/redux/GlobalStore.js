import { configureStore } from '@reduxjs/toolkit';
import utilReducer, { resetUtil } from './reducer/utilReducer';
import chatStoreReducer, { resetChatStore } from './reducer/chatReducer.js';
import reportReducer, { resetReportStore } from './reducer/reportReducer';
import authStoreReducer, { resetAuthStore } from './reducer/authReducer';

const reduxStore = configureStore({
	reducer: {
		utilReducer: utilReducer,
		chatStoreReducer: chatStoreReducer,
		reportStoreReducer: reportReducer,
		authStoreReducer: authStoreReducer
	},
});

/ * whenever add new slice, add reset method here. */;
export const resetAllStores = () => {
	reduxStore.dispatch(resetChatStore());
	reduxStore.dispatch(resetUtil());
	reduxStore.dispatch(resetReportStore());
	reduxStore.dispatch(resetAuthStore());
};

export default reduxStore;
