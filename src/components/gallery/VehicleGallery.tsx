import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import type { Vehicle } from "../../types/vehicle";
import { VehicleImage } from "../common/VehicleImage";

interface VehicleGalleryProps {
  vehicle: Vehicle;
}

export const VehicleGallery: React.FC<VehicleGalleryProps> = ({ vehicle }) => {
  const images = [vehicle.heroImage, ...(vehicle.gallery || [])];
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const handleNext = useCallback(() => {
    if (fullscreenIndex === null) return;
    setFullscreenIndex((prev) => (prev! + 1) % images.length);
  }, [fullscreenIndex, images.length]);

  const handlePrev = useCallback(() => {
    if (fullscreenIndex === null) return;
    setFullscreenIndex((prev) => (prev! - 1 + images.length) % images.length);
  }, [fullscreenIndex, images.length]);

  const handleClose = useCallback(() => {
    setFullscreenIndex(null);
  }, []);

  // Keyboard navigation: ESC, Left, Right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenIndex === null) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenIndex, handleClose, handleNext, handlePrev]);

  return (
    <section className="py-16 border-t border-white/10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#d40000] font-bold block mb-1">
            PHOTOGRAPHY ARCHIVE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-white dark:text-white light:!text-black tracking-wide">
            VEHICLE GALLERY
          </h2>
        </div>
        <div className="font-mono-tech text-xs tracking-widest text-white/40 uppercase">
          {images.length.toString().padStart(2, "0")} PERSPECTIVES
        </div>
      </div>

      {/* Grid of photos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((imgSrc, idx) => (
          <div
            key={idx}
            onClick={() => setFullscreenIndex(idx)}
            className={`group relative overflow-hidden bg-[#0d0d14] border border-white/10 hover:border-[#d40000] cursor-pointer transition-all duration-300 ${
              idx === 0 ? "md:col-span-2 md:h-[480px] h-[320px]" : "h-[280px]"
            }`}
          >
            <VehicleImage
              src={imgSrc}
              alt={`${vehicle.name} photo ${idx + 1}`}
              vehicle={vehicle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
              <span className="font-mono-tech text-xs tracking-widest text-white">
                {(idx + 1).toString().padStart(2, "0")} / {images.length.toString().padStart(2, "0")}
              </span>
              <Maximize2 className="w-4 h-4 text-white/70" />
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Modal Viewer */}
      {fullscreenIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none">
          {/* Top Bar with counter & close */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white z-10">
            <span className="font-mono-tech text-sm tracking-widest uppercase">
              {vehicle.name} &middot; {(fullscreenIndex + 1).toString().padStart(2, "0")} /{" "}
              {images.length.toString().padStart(2, "0")}
            </span>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Main Fullscreen Image */}
          <div className="max-w-6xl max-h-[82vh] flex items-center justify-center">
            <VehicleImage
              src={images[fullscreenIndex]}
              alt={`${vehicle.name} fullscreen view`}
              vehicle={vehicle}
              className="max-w-full max-h-[82vh] object-contain shadow-2xl"
            />
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </section>
  );
};
