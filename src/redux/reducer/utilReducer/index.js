import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	isSideNavOpen: true,
	suggestionData: {},
	dataSources: [],
	sessionHistory: [],
};

const utilSlice = createSlice({
	name: 'util',
	initialState,
	reducers: {
		setUtil(state, action) {
			return (state = action.payload);
		},
		updateUtilProp(state, action) {
			action.payload.forEach((authProp) => {
				state[authProp['key']] = authProp['value'];
			});
			return state;
		},
		resetUtil(state, action) {
			state = initialState;
			return state;
		},
	},
});

export const { setUtil, updateUtilProp, resetUtil } = utilSlice.actions;
export default utilSlice.reducer;
