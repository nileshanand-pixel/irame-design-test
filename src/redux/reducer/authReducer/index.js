import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	user_id: '',
	selectedTeamId: '',
};

const AuthStoreSlice = createSlice({
	name: 'Auth',
	initialState,
	reducers: {
		setAuthStore(state, action) {
			return (state = action.payload);
		},
		updateAuthStoreProp(state, action) {
			const newState = {
				...state,
				...action.payload.reduce((acc, prop) => {
					acc[prop.key] = prop.value;
					return acc;
				}, {}),
			};

			// Handle selectedTeamId persistence
			const userId = newState.user_id;
			const teamId = newState.selectedTeamId;
			if (userId && teamId) {
				localStorage.setItem(`team_${userId}`, teamId);
			}

			return newState;
		},
		setSelectedTeam(state, action) {
			state.selectedTeamId = action.payload;
			if (state.user_id) {
				localStorage.setItem(`team_${state.user_id}`, action.payload);
			}
		},
		resetAuthStore(state, action) {
			state = initialState;
			return state;
		},
	},
});

export const { setAuthStore, updateAuthStoreProp, resetAuthStore, setSelectedTeam } =
	AuthStoreSlice.actions;
export default AuthStoreSlice.reducer;
