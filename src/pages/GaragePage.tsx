import React, { useState, useMemo } from "react";
import { vehicles } from "../data/vehicles";
import { VehicleCard } from "../components/garage/VehicleCard";
import { ExplodedViewSection } from "../components/garage/ExplodedViewSection";
import { Search } from "lucide-react";

export const GaragePage: React.FC = () => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesType =
        filterType === "ALL" ||
        (filterType === "RACE_ALL" ? (v.type === "RACE" || v.type === "FORMULA") : v.type === filterType);
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.year && v.year.toString().includes(searchQuery));
      return matchesType && matchesSearch;
    });
  }, [filterType, searchQuery]);

  const categoryTabs: { label: string; value: string }[] = [
    { label: "ALL EDITIONS (15)", value: "ALL" },
    { label: "ROAD CARS", value: "ROAD" },
    { label: "HYPERCARS", value: "HYPERCAR" },
    { label: "COMPETIZIONE", value: "RACE_ALL" },
    { label: "FORMULA 1", value: "FORMULA" },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {/* 1. Cinematic Scroll-Driven Exploded Ferrari Sequence */}
      <ExplodedViewSection />

      {/* 2. Showroom Grid Section */}
      <div className="pt-16 pb-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <section className="mb-12 border-b border-white/10 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-[#d40000] rotate-45" />
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#d40000] font-bold">
                  OFFICIAL COLLECTION
                </span>
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl md:text-7xl uppercase tracking-tight text-white">
                FERRARI GARAGE
              </h1>
              <p className="font-sans text-xs sm:text-sm text-white/50 max-w-2xl mt-2 tracking-wide">
                Fifteen monuments of Maranello performance. From homologation Group B icons to modern hybrid hypercars and Scuderia Grand Prix racers.
              </p>
            </div>

            {/* Quick Counter */}
            <div className="font-mono-tech text-right hidden sm:block">
              <span className="text-3xl md:text-4xl font-bold text-white tracking-tighter">
                {filteredVehicles.length.toString().padStart(2, "0")}
              </span>
              <span className="text-white/40 text-xs tracking-widest block uppercase">
                / {vehicles.length} ARCHIVED
              </span>
            </div>
          </div>

          {/* Filter Controls & Search */}
          <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterType(tab.value)}
                  className={`font-mono-tech text-xs uppercase tracking-widest px-4 py-2 border transition-all whitespace-nowrap cursor-pointer ${
                    filterType === tab.value
                      ? "bg-[#d40000] border-[#d40000] text-white shadow-[0_0_15px_rgba(212,0,0,0.3)]"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="SEARCH VEHICLE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-9 py-2 text-xs font-mono-tech text-white placeholder:text-white/30 uppercase focus:outline-none focus:border-[#d40000] transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Grid Showroom Layout */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle, index) => {
            const isFeatured =
              filterType === "ALL" && (vehicle.slug === "288-gto" || (vehicle.slug === "laferrari" && index === 1));

            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                featured={isFeatured}
              />
            );
          })}
        </section>

        {filteredVehicles.length === 0 && (
          <div className="py-24 text-center border border-white/5 bg-[#0d0d12]">
            <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-white/40">
              NO FERRARI VEHICLES MATCH YOUR QUERY
            </p>
            <button
              onClick={() => {
                setFilterType("ALL");
                setSearchQuery("");
              }}
              className="mt-4 font-mono-tech text-xs uppercase tracking-wider text-[#d40000] hover:underline cursor-pointer"
            >
              RESET FILTERS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
