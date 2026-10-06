import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Volume2, VolumeX, ChevronLeft, Menu, X } from "lucide-react";
import { useTestDriveStore } from "../../store/testDriveStore";
import { Switch } from "../common/ThemeSwitch";

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const soundEnabled = useTestDriveStore((state) => state.soundEnabled);
  const toggleSound = useTestDriveStore((state) => state.toggleSound);

  // If on landing page "/", keep it completely minimal per Section 9 & 10
  if (location.pathname === "/") {
    return null;
  }

  const isVehiclePage = location.pathname.startsWith("/garage/");

  // Removed RACE and TEST DRIVE per user instructions
  const navLinks = [
    { label: "HOME", path: "/" },
    { label: "GARAGE", path: "/garage" },
    { label: "CARS", path: "/cars" },
    { label: "COMPARE", path: "/compare" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#070709]/90 dark:bg-[#070709]/90 light:bg-white/95 backdrop-blur-md border-b border-white/10 dark:border-white/10 light:border-zinc-200 text-white dark:text-white light:text-zinc-900 px-6 lg:px-12 py-3 transition-colors duration-200 shadow-md">
      <div className="relative max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Back link */}
        <div className="flex items-center gap-6">
          {isVehiclePage && (
            <Link
              to="/cars"
              className="group flex items-center gap-1.5 text-xs font-mono-tech tracking-wider text-white/60 dark:text-white/60 light:text-zinc-600 hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#d40000]" />
              <span>COLLECTION</span>
            </Link>
          )}

          <Link to="/garage" className="flex items-center gap-3 group">
            {/* Authentic Ferrari Logo Emblem - Cropped on left & right, surrounded with red shade */}
            <div className="relative h-10 w-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-[#d40000]/35 blur-lg rounded-full pointer-events-none -z-10" />
              <img
                src="/assets/photos/ferrari_shield.png"
                alt="Ferrari Shield Emblem"
                className="h-9 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(212,0,0,0.8)] drop-shadow-[0_0_20px_rgba(212,0,0,0.45)]"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg tracking-[0.2em] font-extrabold leading-tight text-white dark:text-white light:text-zinc-950">
                FERRARI
              </span>
              <span className="text-[9px] font-mono-tech tracking-[0.3em] text-white/50 dark:text-white/50 light:text-zinc-500 -mt-0.5 uppercase">
                DIGITAL GARAGE
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Desktop Navigation: HOME, GARAGE, CARS, COMPARE */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-mono-tech text-xs tracking-[0.22em] transition-colors py-1 flex items-center cursor-pointer ${
                  isActive
                    ? "text-[#d40000] border-b-2 border-[#d40000] font-bold"
                    : "text-white/70 dark:text-white/70 light:text-zinc-600 hover:text-[#d40000] dark:hover:text-white light:hover:text-black"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right utility controls */}
        <div className="flex items-center">
          {/* Light / Dark Mode Switch */}
          <div className="hidden sm:flex items-center">
            <Switch />
          </div>

          <div className="h-6 w-px bg-white/20 dark:bg-white/20 light:bg-zinc-300 mx-5 hidden sm:block" />

          {/* Sound Mute/Unmute */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Mute engine audio" : "Enable engine audio"}
              className="px-2.5 py-1.5 rounded bg-white/10 dark:bg-white/10 light:bg-zinc-100 hover:bg-white/20 light:hover:bg-zinc-200 border border-white/15 dark:border-white/15 light:border-zinc-300 text-white dark:text-white light:text-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#d40000]" />
                  <span className="text-[10px] font-mono-tech hidden xl:inline text-white/80 dark:text-white/80 light:text-zinc-700">AUDIO ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-white/40 dark:text-white/40 light:text-zinc-400" />
                  <span className="text-[10px] font-mono-tech hidden xl:inline text-white/40 dark:text-white/40 light:text-zinc-400">AUDIO OFF</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden ml-3 p-2 rounded bg-white/10 dark:bg-white/10 light:bg-zinc-100 border border-white/15 dark:border-white/15 light:border-zinc-300 text-white dark:text-white light:text-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden pt-4 pb-2 border-t border-white/10 dark:border-white/10 light:border-zinc-200 mt-3 flex flex-col gap-3 font-mono-tech text-xs tracking-widest uppercase">
          <div className="flex justify-center pb-2">
            <Switch />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded flex items-center justify-between ${
                location.pathname === link.path
                  ? "bg-[#d40000] text-white font-bold"
                  : "text-white/70 dark:text-white/70 light:text-zinc-700 hover:text-white hover:bg-white/5 light:hover:bg-zinc-100"
              }`}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
