import { useCallback, useState } from "react";

export default function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "dark");

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("cs-theme", next);
    } catch {
      /* storage unavailable */
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
