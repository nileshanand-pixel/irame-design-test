import { createSlice } from '@reduxjs/toolkit';


const initialState = {
    selectedReport: {}
};

const ReportStoreSlice = createSlice({
	name: 'report',
	initialState,
	reducers: {
		setReportStore(state, action) {
			return (state = action.payload);
		},
		updateReportStoreProp(state, action) {
			return {
				...state,
				...action.payload.reduce((acc, prop) => {
					acc[prop.key] = prop.value;
					return acc;
				}, {}),
			};
		},
		resetReportStore(state, action) {
			state = initialState;
			return state;
		},
	},
});

export const { setReportStore, updateReportStoreProp, resetReportStore } =
	ReportStoreSlice.actions;
export default ReportStoreSlice.reducer;
