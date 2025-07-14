import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	user_id: '',
};

const AuthStoreSlice = createSlice({
	name: 'Auth',
	initialState,
	reducers: {
		setAuthStore(state, action) {
			return (state = action.payload);
		},
		updateAuthStoreProp(state, action) {
			return {
				...state,
				...action.payload.reduce((acc, prop) => {
					acc[prop.key] = prop.value;
					return acc;
				}, {}),
			};
		},
		resetAuthStore(state, action) {
			state = initialState;
			return state;
		},
	},
});

export const { setAuthStore, updateAuthStoreProp, resetAuthStore } =
	AuthStoreSlice.actions;
export default AuthStoreSlice.reducer;
