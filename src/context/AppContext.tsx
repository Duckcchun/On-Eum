import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { triggerAlert, updateAlertSettings } from '../services/AlertService';
import { startDetection, stopDetection } from '../services/ThreatDetector';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DetectionLog {
  id: string;
  type: string;
  timestamp: string;
  date: string;
  severity: 'danger' | 'warning' | 'info';
}

export interface AppSettings {
  rmsThreshold: number;
  hapticEnabled: boolean;
  audioEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

interface AppState {
  isActive: boolean;
  isDetecting: boolean;
  logs: DetectionLog[];
  stats: { totalDetections: number; activeTime: number; todayDetections: number };
  settings: AppSettings;
}

interface AppContextType extends AppState {
  toggleDetection: () => void;
  updateSettings: (settings: AppSettings) => void;
  clearLogs: () => void;
  dismissDetection: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [stats, setStats] = useState({ totalDetections: 0, activeTime: 0, todayDetections: 0 });
  const [settings, setSettings] = useState<AppSettings>({
    rmsThreshold: 0.15,
    hapticEnabled: true,
    audioEnabled: true,
    sensitivity: 'medium',
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Active time counter
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setStats(prev => ({ ...prev, activeTime: prev.activeTime + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('onEumSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        updateAlertSettings({
          hapticEnabled: parsed.hapticEnabled,
          audioEnabled: parsed.audioEnabled,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const addLog = useCallback((type: string) => {
    const now = new Date();
    const newLog: DetectionLog = {
      id: Date.now().toString(),
      type,
      timestamp: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('ko-KR'),
      severity: type.includes('킥보드') ? 'danger' : type.includes('오토바이') ? 'warning' : 'danger',
    };

    setLogs(prev => [newLog, ...prev].slice(0, 100)); // max 100 logs
    setStats(prev => ({
      ...prev,
      totalDetections: prev.totalDetections + 1,
      todayDetections: prev.todayDetections + 1,
    }));
    setIsDetecting(true);

    // Auto dismiss after 5 seconds
    if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current);
    detectTimeoutRef.current = setTimeout(() => {
      setIsDetecting(false);
    }, 5000);
  }, []);

  const toggleDetection = useCallback(() => {
    const newState = !isActive;
    setIsActive(newState);

    if (newState) {
      startDetection(addLog, settings);
    } else {
      stopDetection();
      setIsDetecting(false);
    }
  }, [isActive, settings, addLog]);

  const updateSettingsHandler = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    updateAlertSettings({
      hapticEnabled: newSettings.hapticEnabled,
      audioEnabled: newSettings.audioEnabled,
    });
    try {
      await AsyncStorage.setItem('onEumSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setStats(prev => ({ ...prev, totalDetections: 0, todayDetections: 0 }));
  }, []);

  const dismissDetection = useCallback(() => {
    setIsDetecting(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isActive,
        isDetecting,
        logs,
        stats,
        settings,
        toggleDetection,
        updateSettings: updateSettingsHandler,
        clearLogs,
        dismissDetection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
