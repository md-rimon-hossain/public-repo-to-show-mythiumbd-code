"use client";

import { useTheme } from "next-themes";
import { GlassButton } from "@/components/ui/glass-button";
import { Sun, Moon, Laptop } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <GlassButton size="icon" variant="ghost" />;
  }

  const toggleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  return (
    <GlassButton
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      className="relative overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" && (
          <motion.div
            key="light"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        )}
        {theme === "dark" && (
          <motion.div
            key="dark"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        )}
        {theme === "system" && (
          <motion.div
            key="system"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Laptop className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </GlassButton>
  );
}
