import { useContext } from "react";
import { ThemeProvider } from "../providers/ThemeProvider";

export const useTheme = () => {
  const context = useContext(ThemeProvider);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};