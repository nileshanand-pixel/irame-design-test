import { configureStore } from '@reduxjs/toolkit';
import utilReducer, { resetUtil } from './reducer/utilReducer';
import chatStoreReducer, { resetChatStore } from './reducer/chatReducer.js';

const reduxStore = configureStore({
	reducer: {
		utilReducer: utilReducer,
		chatStoreReducer: chatStoreReducer,
	},
});

/ * whenever add new slice, add reset method here. */;
export const resetAllStores = () => {
	reduxStore.dispatch(resetChatStore());
	reduxStore.dispatch(resetUtil());
};

export default reduxStore;
