import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
    }),
    {
      name: 'taler-settings',
    }
  )
);
