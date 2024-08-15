import React, { createContext, useEffect, useReducer } from 'react';
import DOMPurify from 'dompurify';
import { useSelector } from 'react-redux';

const initialState = {
  segments: [],
  selectedColumns: {},
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
      return {...initialState}
    default:
      return state;
  }
};

export const EditContext = createContext();

export const WorkspaceEditProvider = ({ children }) => {
  const [state, dispatch] = useReducer(editReducer, initialState);

  const setSegments = (segments) => dispatch({ type: 'SET_SEGMENTS', payload: segments });
  const setSelectedColumns = (columns) => dispatch({ type: 'SET_SELECTED_COLUMNS', payload: columns });
  const handleColumnChange = (fileId, columns) =>
    dispatch({ type: 'UPDATE_COLUMNS', payload: { fileId, columns } });

  return (
    <EditContext.Provider
      value={{
        segments: state.segments,
        selectedColumns: state.selectedColumns,
        setSegments,
        setSelectedColumns,
        handleColumnChange,
      }}
    >
      {children}
    </EditContext.Provider>
  );
};
