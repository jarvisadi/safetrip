import { create } from 'zustand';

export const useAlertsStore = create((set) => ({
  alerts: [],
  activeAlert: null,
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({
    alerts: [...state.alerts, alert]
  })),
  setActiveAlert: (alert) => set({ activeAlert: alert }),
  clearActiveAlert: () => set({ activeAlert: null }),
  clearAlerts: () => set({ alerts: [], activeAlert: null }),
}));
