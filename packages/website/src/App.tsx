import { useState } from "react";
import { AmbientBackground } from "./components/AmbientBackground";
import { Changelog } from "./components/Changelog";
import { Download } from "./components/Download";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Integrations } from "./components/Integrations";
import { LocalFirst } from "./components/LocalFirst";
import { Nav } from "./components/Nav";
import { OpenSource } from "./components/OpenSource";
import { Security } from "./components/Security";
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
    <div className="relative min-h-screen bg-plane">
      <AmbientBackground />
      <div className="relative z-10">
        <Nav dark={dark} onToggleDark={toggleDark} />
        <main>
          <Hero />
          <StatsBar />
          <Integrations />
          <HowItWorks />
          <Features />
          <LocalFirst />
          <Security />
          <OpenSource />
          <FAQ />
          <Changelog />
          <Download />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
