import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	createReport: false,
	shareReport: false,
	revalidateQuery: null,
};

const modalReducer = createSlice({
	name: 'modal',
	initialState,
	reducers: {
		openModal: (state, action) => {
			const { modalName, revalidateQuery } = action.payload;
			state[modalName] = true;
			state.revalidateQuery = revalidateQuery;
		},
		closeModal: (state, action) => {
			const modalName = action.payload;
			state[modalName] = false;
			state.revalidateQuery = null;
		},
		closeAllModals: (state) => {
			Object.keys(state).forEach((key) => {
				state[key] = false;
			});
		},
		resetModalStore: () => initialState,
	},
});

export const { openModal, closeModal, closeAllModals, resetModalStore } =
	modalReducer.actions;

export default modalReducer.reducer;
