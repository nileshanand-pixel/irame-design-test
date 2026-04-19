import { createContext, useContext, useRef, useCallback } from 'react';

const NavigationGuardContext = createContext(null);

export const NavigationGuardProvider = ({ children }) => {
	const guardRef = useRef(null);

	const setGuard = useCallback((guardFn) => {
		guardRef.current = guardFn;
	}, []);

	const clearGuard = useCallback(() => {
		guardRef.current = null;
	}, []);

	// Returns the guard fn if one is set, otherwise null
	const getGuard = useCallback(() => guardRef.current, []);

	return (
		<NavigationGuardContext.Provider value={{ setGuard, clearGuard, getGuard }}>
			{children}
		</NavigationGuardContext.Provider>
	);
};

export const useNavigationGuard = () => {
	const ctx = useContext(NavigationGuardContext);
	if (!ctx)
		throw new Error(
			'useNavigationGuard must be used within NavigationGuardProvider',
		);
	return ctx;
};
