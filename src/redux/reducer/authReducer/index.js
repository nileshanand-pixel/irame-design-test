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
		syncAuthIdentity(state, action) {
			const userDetails = action.payload;
			const userId =
				userDetails.user_id ||
				userDetails.id ||
				userDetails.sub ||
				userDetails.userId;

			if (userId) {
				state.user_id = userId;
			}

			// Initialize team if not already set
			if (!state.selectedTeamId && userId) {
				const savedTeamId = localStorage.getItem(`team_${userId}`);
				const apiTeamId =
					userDetails.team_id || userDetails.selected_team_id;

				if (savedTeamId) {
					state.selectedTeamId = savedTeamId;
				} else if (apiTeamId) {
					state.selectedTeamId = apiTeamId;
					localStorage.setItem(`team_${userId}`, apiTeamId);
				}
			}
		},
		resetAuthStore(state, action) {
			state = initialState;
			return state;
		},
	},
});

export const {
	setAuthStore,
	updateAuthStoreProp,
	resetAuthStore,
	setSelectedTeam,
	syncAuthIdentity,
} = AuthStoreSlice.actions;
export default AuthStoreSlice.reducer;
