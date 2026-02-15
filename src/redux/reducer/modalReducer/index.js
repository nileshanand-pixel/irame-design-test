import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	createReport: false,
	shareReport: false,
	revalidateQuery: null,
	defaultVisibility: null,
};

const modalReducer = createSlice({
	name: 'modal',
	initialState,
	reducers: {
		openModal: (state, action) => {
			const { modalName, revalidateQuery, defaultVisibility } = action.payload;
			state[modalName] = true;
			state.revalidateQuery = revalidateQuery;
			state.defaultVisibility = defaultVisibility ?? null;
		},
		closeModal: (state, action) => {
			const modalName = action.payload;
			state[modalName] = false;
			state.revalidateQuery = null;
			state.defaultVisibility = null;
		},
		closeAllModals: (state) => {
			Object.assign(state, initialState);
		},
		resetModalStore: () => initialState,
	},
});

export const { openModal, closeModal, closeAllModals, resetModalStore } =
	modalReducer.actions;

export default modalReducer.reducer;
