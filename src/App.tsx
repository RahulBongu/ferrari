import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "./components/navigation/Navigation";
import { LandingPage } from "./pages/LandingPage";
import { Analytics } from "@vercel/analytics/react";

// Code-split pages for instantaneous initial load and lazy 3D loading
const GaragePage = React.lazy(() =>
  import("./pages/GaragePage").then((m) => ({ default: m.GaragePage }))
);
const VehiclePage = React.lazy(() =>
  import("./pages/VehiclePage").then((m) => ({ default: m.VehiclePage }))
);
const ComparePage = React.lazy(() =>
  import("./pages/ComparePage").then((m) => ({ default: m.ComparePage }))
);
const CarsPage = React.lazy(() =>
  import("./pages/CarsPage").then((m) => ({ default: m.CarsPage }))
);

import { Loader } from "./components/common/Loader";

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-center p-6">
    <Loader scale={0.7} label="LOADING ARCHIVE..." />
  </div>
);

// Scroll to top automatically when navigating between pages
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const rawBase = import.meta.env.BASE_URL || "";
const routerBasename = rawBase === "/" ? undefined : rawBase.replace(/\/+$/, "") || undefined;

export const App: React.FC = () => {
  return (
    <BrowserRouter basename={routerBasename}>
      <ScrollToTop />
      <Analytics />
      <div className="min-h-screen bg-[#070709] text-white flex flex-col selection:bg-[#d40000] selection:text-white">
        <Navigation />
        <main className="flex-1">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/garage" element={<GaragePage />} />
              <Route path="/cars" element={<CarsPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/garage/:vehicleId" element={<VehiclePage />} />
              {/* Fallback route */}
              <Route path="*" element={<GaragePage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
