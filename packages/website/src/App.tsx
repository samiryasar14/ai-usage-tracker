import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Download } from "./components/Download";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Nav } from "./components/Nav";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";

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
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <Features />
                <Download />
              </>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
