import React, { createContext, useContext, useEffect, useReducer } from 'react';
import DOMPurify from 'dompurify';
import { useSelector } from 'react-redux';

const initialState = {
	segments: [],
	selectedColumns: {},
	changeSets: {
		planner: false,
		reference: false,
	},
};

const editReducer = (state, action) => {
	switch (action.type) {
		case 'SET_SEGMENTS':
			return { ...state, segments: action.payload };
		case 'SET_SELECTED_COLUMNS':
			return { ...state, selectedColumns: action.payload };
		case 'UPDATE_COLUMNS':
			return {
				...state,
				selectedColumns: {
					...state.selectedColumns,
					[action.payload.fileId]: action.payload.columns,
				},
			};
		case 'RESET':
			return { ...initialState };
		case 'CHANGE_SET':
			return {
				...state,
				changeSets: action.payload,
			};
		default:
			return state;
	}
};

export const EditContext = createContext();
export const useWorkspaceEdit = () => {
	return useContext(EditContext);
};

export const WorkspaceEditProvider = ({ children, regenerator, editDisabled }) => {
	const [state, dispatch] = useReducer(editReducer, initialState);

	const setSegments = (segments) =>
		dispatch({ type: 'SET_SEGMENTS', payload: segments });
	const setSelectedColumns = (columns) =>
		dispatch({ type: 'SET_SELECTED_COLUMNS', payload: columns });
	const handleColumnChange = (fileId, columns) =>
		dispatch({ type: 'UPDATE_COLUMNS', payload: { fileId, columns } });
	const setChangesets = (changeSets) =>
		dispatch({ type: 'CHANGE_SET', payload: changeSets });

	const regenerateResponse = async (answer) => {
		if (Object.keys(answer).length <= 0) return;
		// let query = '';

		// // Removing updated keyword
		// // if(state.changeSets.planner && state.changeSets.reference){
		// //   query+= "Updated planner and reference"
		// // }else if(state.changeSets.planner){
		// //   query+= "Updated Planner"
		// // }else if(state.changeSets.reference){
		// //   query += "Updated Reference"
		// // }

		// if(query){
		//   query += ` for earlier query(${answer.query})`;
		// }

		const workspaceChanges = {};
		workspaceChanges.query = answer.query;
		workspaceChanges.metadata = answer.metadata;
		workspaceChanges.apiConfig = {
			previous_query_id: answer.query_id,
		};

		if (state.changeSets.planner) {
			workspaceChanges.apiConfig.planner = {
				text: state.segments.join('\n'),
			};
		}

		if (state.changeSets.reference) {
			const referenceChange = {};
			Object.keys(state.selectedColumns)?.forEach((key) => {
				if (state.selectedColumns[key].length > 0) {
					referenceChange[key] = {
						columns_used: state.selectedColumns[key],
					};
				}
			});
			workspaceChanges.apiConfig.reference = referenceChange;
		}

		await regenerator(answer, workspaceChanges);
		setChangesets({ planner: false, reference: false });
	};

	return (
		<EditContext.Provider
			value={{
				segments: state.segments,
				selectedColumns: state.selectedColumns,
				changeSets: state.changeSets,
				editDisabled,
				setSegments,
				setSelectedColumns,
				handleColumnChange,
				regenerateResponse,
				setChangesets,
			}}
		>
			{children}
		</EditContext.Provider>
	);
};
