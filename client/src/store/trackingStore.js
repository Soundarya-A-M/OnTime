import { create } from 'zustand';

export const useTrackingStore = create((set) => ({
    activeBuses: {},
    trackedBusId: null,

    updateBusLocation: (busId, location) => {
        set((state) => ({
            activeBuses: {
                ...state.activeBuses,
                [busId]: {
                    ...state.activeBuses[busId],
                    location,
                    lastUpdated: new Date()
                }
            }
        }));
    },

    setTrackedBus: (busId) => {
        set({ trackedBusId: busId });
    },

    clearTrackedBus: () => {
        set({ trackedBusId: null });
    },

    setBusData: (busId, data) => {
        set((state) => ({
            activeBuses: {
                ...state.activeBuses,
                [busId]: {
                    ...state.activeBuses[busId],
                    ...data
                }
            }
        }));
    }
}));
