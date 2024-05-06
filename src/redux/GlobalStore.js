import { configureStore } from '@reduxjs/toolkit';
import utilReducer from './reducer/utilReducer';

const reduxStore = configureStore({
	reducer: {
		utilReducer: utilReducer,
	},
});

export default reduxStore;
