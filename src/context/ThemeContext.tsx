import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("ferrari-theme");
      return saved === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("ferrari-theme", t);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.backgroundColor = "#070709";
      root.style.color = "#ffffff";
      document.body.style.backgroundColor = "#070709";
      document.body.style.color = "#ffffff";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.backgroundColor = "#f6f7f9";
      root.style.color = "#111118";
      document.body.style.backgroundColor = "#f6f7f9";
      document.body.style.color = "#111118";
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export const useTheme = () => useContext(ThemeContext);
