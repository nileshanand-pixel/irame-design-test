import { configureStore } from '@reduxjs/toolkit';
import utilReducer from './reducer/utilReducer';
import chatStoreReducer from './reducer/chatReducer.js';

const reduxStore = configureStore({
	reducer: {
		utilReducer: utilReducer,
		chatStoreReducer: chatStoreReducer
	},
});

export default reduxStore;
