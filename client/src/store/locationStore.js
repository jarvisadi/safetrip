import { create } from 'zustand';

export const useLocationStore = create((set) => ({
  currentLocation: null,
  locationHistory: [],
  setCurrentLocation: (location) => set({ currentLocation: location }),
  addToHistory: (location) => set((state) => ({
    locationHistory: [...state.locationHistory, location]
  })),
  clearHistory: () => set({ locationHistory: [] }),
}));
