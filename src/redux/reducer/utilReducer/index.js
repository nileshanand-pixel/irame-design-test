import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	isSideNavOpen: true,
	suggestionData: {},
	dataSources: [],
	sessionHistory: [],
	selectedDataSource: {id: "", name: ""},
	resetChat: false,
	answerFromHistory: {},
	isGenerateReportModalOpen: false,
};

const utilSlice = createSlice({
	name: 'util',
	initialState,
	reducers: {
		setUtil(state, action) {
			return (state = action.payload);
		},
		updateUtilProp(state, action) {
			return {
				...state,
				...action.payload.reduce((acc, prop) => {
					acc[prop.key] = prop.value;
					return acc;
				}, {}),
			};
		},
		resetUtil(state, action) {
			state = initialState;
			return state;
		},
	},
});

export const { setUtil, updateUtilProp, resetUtil } = utilSlice.actions;
export default utilSlice.reducer;
