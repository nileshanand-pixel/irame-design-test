import { createSlice } from '@reduxjs/toolkit';

// Query Obj
/**
 * Query Object
 * {
 *      id: '',
 *      question: ''
 * }
 */
const initialState = {
	queries: [],
    activeChatSession: {
        id: '',
        title: ''
    },
    initialQuery: {id: '', question: ''},
	inputPrompt: '',
	refreshChat: false,
	activeQueryId: '',
	resetIra: false,
	activateGraphOnLatest: false,
};

const chatStoreSlice = createSlice({
	name: 'chat',
	initialState,
	reducers: {
		setChatStore(state, action) {
			return (state = action.payload);
		},
		updateChatStoreProp(state, action) {
			return {
				...state,
				...action.payload.reduce((acc, prop) => {
					acc[prop.key] = prop.value;
					return acc;
				}, {}),
			};
		},
		resetChatStore(state, action) {
			state = initialState;
			return state;
		},
	},
});

export const { setChatStore, updateChatStoreProp, resetChatStore } = chatStoreSlice.actions;
export default chatStoreSlice.reducer;
