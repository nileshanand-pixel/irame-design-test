import { configureStore } from '@reduxjs/toolkit';
import utilReducer, { resetUtil } from './reducer/utilReducer';
import chatStoreReducer, { resetChatStore } from './reducer/chatReducer.js';
import reportReducer, { resetReportStore } from './reducer/reportReducer';
import authStoreReducer, { resetAuthStore } from './reducer/authReducer';
import modalReducer, { resetModalStore } from './reducer/modalReducer';

const reduxStore = configureStore({
	reducer: {
		utilReducer: utilReducer,
		chatStoreReducer: chatStoreReducer,
		reportStoreReducer: reportReducer,
		authStoreReducer: authStoreReducer,
		modalReducer: modalReducer,
	},
});

/** whenever add new slice, add reset method here. **/ export const resetAllStores =
	() => {
		reduxStore.dispatch(resetChatStore());
		reduxStore.dispatch(resetUtil());
		reduxStore.dispatch(resetReportStore());
		reduxStore.dispatch(resetAuthStore());
		reduxStore.dispatch(resetModalStore());
	};

export default reduxStore;
