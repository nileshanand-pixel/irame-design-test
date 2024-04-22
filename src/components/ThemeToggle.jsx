import { useTheme } from "@/hooks/useTheme";

const ThemeToggle = () => {
    const {setTheme} = useTheme();
  return (
    <div className="w-10 h-10"
        onClick={() =>
          setTheme((prevTheme) => {
            const newTheme = prevTheme === "light" ? "dark" : "light";
            localStorage.setItem("vite-ui-theme", newTheme);
            return newTheme;
          })
        }
      >
        🌗
    </div>
  );
};

export default ThemeToggle;
