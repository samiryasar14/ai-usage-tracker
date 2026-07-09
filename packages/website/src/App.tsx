import { useState } from "react";
import { Download } from "./components/Download";
import { FAQ } from "./components/FAQ";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Nav } from "./components/Nav";
import { StatsBar } from "./components/StatsBar";

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  return { dark, toggle };
}

export function App() {
  const { dark, toggle: toggleDark } = useDarkMode();

  return (
    <div className="min-h-screen bg-plane">
      <Nav dark={dark} onToggleDark={toggleDark} />
      <main>
        <Hero />
        <StatsBar />
        <HowItWorks />
        <Features />
        <FAQ />
        <Download />
      </main>
      <Footer />
    </div>
  );
}
