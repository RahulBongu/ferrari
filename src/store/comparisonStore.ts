import { create } from "zustand";

interface ComparisonStore {
  selectedSlugs: string[];
  isTrayOpen: boolean;
  addVehicle: (slug: string) => void;
  removeVehicle: (slug: string) => void;
  swapVehicle: (oldSlug: string, newSlug: string) => void;
  setVehicles: (slugs: string[]) => void;
  clearSelection: () => void;
  toggleTray: (open?: boolean) => void;
  isInComparison: (slug: string) => boolean;
}

export const useComparisonStore = create<ComparisonStore>((set, get) => ({
  selectedSlugs: ["288-gto", "laferrari"],
  isTrayOpen: false,

  addVehicle: (slug: string) => {
    const current = get().selectedSlugs;
    if (current.includes(slug)) return;
    if (current.length >= 3) {
      // Keep up to 3 cars
      set({ selectedSlugs: [...current.slice(1), slug], isTrayOpen: true });
    } else {
      set({ selectedSlugs: [...current, slug], isTrayOpen: true });
    }
  },

  removeVehicle: (slug: string) => {
    set((state) => {
      const filtered = state.selectedSlugs.filter((s) => s !== slug);
      return {
        selectedSlugs: filtered,
        isTrayOpen: filtered.length > 0 ? state.isTrayOpen : false,
      };
    });
  },

  swapVehicle: (oldSlug: string, newSlug: string) => {
    set((state) => ({
      selectedSlugs: state.selectedSlugs.map((s) => (s === oldSlug ? newSlug : s)),
    }));
  },

  setVehicles: (slugs: string[]) => set({ selectedSlugs: slugs }),

  clearSelection: () => set({ selectedSlugs: [], isTrayOpen: false }),

  toggleTray: (open?: boolean) =>
    set((state) => ({ isTrayOpen: open !== undefined ? open : !state.isTrayOpen })),

  isInComparison: (slug: string) => get().selectedSlugs.includes(slug),
}));
