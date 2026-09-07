"use client";

import * as React from "react";
import { Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [showTip, setShowTip] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    
    // Show the tooltip 1.5 seconds after load if they are on light theme
    const timer = setTimeout(() => {
      // Only show if the current theme isn't explicitly dark already
      if (document.documentElement.classList.contains('dark') === false) {
        setShowTip(true);
      }
    }, 1500);

    // Auto-hide after 8 seconds
    const hideTimer = setTimeout(() => {
      setShowTip(false);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    setShowTip(false); // Hide the tip as soon as they interact
  };

  if (!mounted) {
    return (
      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-500 dark:text-slate-400">
        <Sun className="size-[18px]" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={toggleTheme}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="size-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      {showTip && theme !== "dark" && (
        <div className="absolute top-14 right-0 md:left-1/2 md:-translate-x-1/2 md:right-auto w-[150px] rounded-xl bg-navy-950 dark:bg-brand-600 text-white px-3 py-2.5 text-[12px] font-semibold shadow-xl animate-fade-in flex items-start gap-2 z-50">
          <div className="absolute -top-1 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 size-3 rotate-45 bg-navy-950 dark:bg-brand-600"></div>
          <span className="relative z-10 leading-snug">Try the new Dark Mode!</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowTip(false); }} 
            className="relative z-10 text-slate-400 hover:text-white mt-0.5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
