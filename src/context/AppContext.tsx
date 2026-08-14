import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { triggerAlert, updateAlertSettings } from '../services/AlertService';
import { startDetection, stopDetection } from '../services/ThreatDetector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentRoute,
  onRouteChange,
  checkMicrophonePermission,
  requestMicrophonePermission,
  AudioRouteInfo,
} from '../native/AudioRouteModule';
import { setAdaptiveMode, onBackgroundStateChange } from '../native/AudioBufferModule';

// ─── Types ───
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

export interface ThreatInfo {
  type: string;
  icon: string;
  severity: 'danger' | 'warning' | 'info';
  detectedAt: string;
}

interface AppState {
  isActive: boolean;
  isDetecting: boolean;
  logs: DetectionLog[];
  stats: { totalDetections: number; activeTime: number; todayDetections: number };
  settings: AppSettings;
  audioRoute: {
    isAirPodsConnected: boolean;
    isBluetoothConnected: boolean;
    deviceName: string;
    outputType: string;
  };
  micPermission: 'granted' | 'denied' | 'undetermined';
}

interface AppContextType extends AppState {
  currentThreat: ThreatInfo | null;
  toggleDetection: () => void;
  updateSettings: (settings: AppSettings) => void;
  clearLogs: () => void;
  dismissDetection: () => void;
  simulateThreat: (threatType?: 'kickboard' | 'motorcycle' | 'vehicle' | 'horn') => void;
  navigateToTab: (tab: string) => void;
  setTabNavigator: (fn: (tab: string) => void) => void;
  requestMicPermission: () => Promise<string>;
  markFalsePositive: (logId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// ─── Storage Keys ───
const STORAGE_KEYS = {
  LOGS: 'onEum_logs',
  STATS: 'onEum_stats',
  SETTINGS: 'onEumSettings',
};

// ─── Threat type definitions ───
const THREAT_TYPES = {
  kickboard: {
    type: '전동 킥보드 접근 감지',
    icon: '🛴',
    severity: 'danger' as const,
  },
  motorcycle: {
    type: '오토바이 접근 감지',
    icon: '🏍️',
    severity: 'warning' as const,
  },
  vehicle: {
    type: '차량 접근 감지',
    icon: '🚗',
    severity: 'danger' as const,
  },
  horn: {
    type: '경적 소리 감지',
    icon: '📢',
    severity: 'warning' as const,
  },
};

// ─── Provider ───
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentThreat, setCurrentThreat] = useState<ThreatInfo | null>(null);
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
  const tabNavigatorRef = useRef<((tab: string) => void) | null>(null);
  const [audioRoute, setAudioRoute] = useState({
    isAirPodsConnected: false,
    isBluetoothConnected: false,
    deviceName: '',
    outputType: 'builtInSpeaker',
  });
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // ─── Load persisted data on mount ───
  useEffect(() => {
    loadPersistedData();
    initAudioRoute();
    checkMicPermission();
  }, []);

  // ─── Audio Route Monitoring ───
  useEffect(() => {
    const unsubscribeRoute = onRouteChange((event) => {
      setAudioRoute({
        isAirPodsConnected: event.isAirPods,
        isBluetoothConnected: event.isBluetoothConnected,
        deviceName: event.deviceModel || event.outputName,
        outputType: event.outputType,
      });
    });

    // Background state: enable adaptive mode when app goes to background
    const unsubscribeBackground = onBackgroundStateChange((event) => {
      if (event.isBackground) {
        setAdaptiveMode(true);
      } else {
        setAdaptiveMode(false);
      }
    });

    return () => {
      unsubscribeRoute();
      unsubscribeBackground();
    };
  }, []);

  const initAudioRoute = async () => {
    const route = await getCurrentRoute();
    if (route) {
      setAudioRoute({
        isAirPodsConnected: route.isAirPods,
        isBluetoothConnected: route.isBluetoothConnected,
        deviceName: route.deviceModel || route.outputName,
        outputType: route.outputType,
      });
    }
  };

  const checkMicPermission = async () => {
    const permission = await checkMicrophonePermission();
    setMicPermission(permission as 'granted' | 'denied' | 'undetermined');
  };

  const requestMicPermission = useCallback(async (): Promise<string> => {
    const result = await requestMicrophonePermission();
    setMicPermission(result as 'granted' | 'denied' | 'undetermined');
    return result;
  }, []);

  // ─── Active time counter ───
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setStats(prev => {
          const updated = { ...prev, activeTime: prev.activeTime + 1 };
          // Save stats every 30 seconds to avoid excessive writes
          if (updated.activeTime % 30 === 0) {
            persistStats(updated);
          }
          return updated;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Persist when going inactive
      persistStats(stats);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // ─── Persistence functions ───
  const loadPersistedData = async () => {
    try {
      const [savedLogs, savedStats, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        setLogs(parsed);
      }

      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        // Reset todayDetections if it's a new day
        const today = new Date().toLocaleDateString('ko-KR');
        const lastDate = parsed.lastDate || '';
        setStats({
          totalDetections: parsed.totalDetections || 0,
          activeTime: parsed.activeTime || 0,
          todayDetections: lastDate === today ? (parsed.todayDetections || 0) : 0,
        });
      }

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        updateAlertSettings({
          hapticEnabled: parsed.hapticEnabled,
          audioEnabled: parsed.audioEnabled,
        });
      }
    } catch (error) {
      console.error('[AppContext] Failed to load persisted data:', error);
    }
  };

  const persistLogs = async (logsToSave: DetectionLog[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logsToSave));
    } catch (error) {
      console.error('[AppContext] Failed to persist logs:', error);
    }
  };

  const persistStats = async (statsToSave: typeof stats) => {
    try {
      const today = new Date().toLocaleDateString('ko-KR');
      await AsyncStorage.setItem(
        STORAGE_KEYS.STATS,
        JSON.stringify({ ...statsToSave, lastDate: today })
      );
    } catch (error) {
      console.error('[AppContext] Failed to persist stats:', error);
    }
  };

  // ─── Tab Navigation ───
  const setTabNavigator = useCallback((fn: (tab: string) => void) => {
    tabNavigatorRef.current = fn;
  }, []);

  const navigateToTab = useCallback((tab: string) => {
    if (tabNavigatorRef.current) {
      tabNavigatorRef.current(tab);
    }
  }, []);

  // ─── Detection & Logging ───
  const addLog = useCallback((type: string) => {
    const now = new Date();
    const newLog: DetectionLog = {
      id: Date.now().toString(),
      type,
      timestamp: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('ko-KR'),
      severity: type.includes('킥보드') || type.includes('차량')
        ? 'danger'
        : type.includes('오토바이') || type.includes('경적')
        ? 'warning'
        : 'danger',
    };

    // Set current threat info
    const threatInfo: ThreatInfo = {
      type: newLog.type,
      icon: type.includes('킥보드') ? '🛴'
        : type.includes('오토바이') ? '🏍️'
        : type.includes('차량') ? '🚗'
        : type.includes('경적') ? '📢'
        : '⚠️',
      severity: newLog.severity,
      detectedAt: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setCurrentThreat(threatInfo);

    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      persistLogs(updated);
      return updated;
    });

    setStats(prev => {
      const updated = {
        ...prev,
        totalDetections: prev.totalDetections + 1,
        todayDetections: prev.todayDetections + 1,
      };
      persistStats(updated);
      return updated;
    });

    setIsDetecting(true);

    // Auto dismiss after 5 seconds
    if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current);
    detectTimeoutRef.current = setTimeout(() => {
      setIsDetecting(false);
      setCurrentThreat(null);
    }, 5000);
  }, []);

  const simulateThreat = useCallback((threatType: 'kickboard' | 'motorcycle' | 'vehicle' | 'horn' = 'kickboard') => {
    const threat = THREAT_TYPES[threatType];
    addLog(threat.type);
    triggerAlert();
  }, [addLog]);

  const toggleDetection = useCallback(() => {
    const newState = !isActive;
    setIsActive(newState);

    if (newState) {
      startDetection(addLog, settings);
    } else {
      stopDetection();
      setIsDetecting(false);
      setCurrentThreat(null);
    }
  }, [isActive, settings, addLog]);

  const updateSettingsHandler = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    updateAlertSettings({
      hapticEnabled: newSettings.hapticEnabled,
      audioEnabled: newSettings.audioEnabled,
    });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('[AppContext] Failed to save settings:', error);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setStats(prev => {
      const updated = { ...prev, totalDetections: 0, todayDetections: 0 };
      persistStats(updated);
      return updated;
    });
    persistLogs([]);
  }, []);

  const dismissDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentThreat(null);
  }, []);

  const markFalsePositive = useCallback((logId: string) => {
    setLogs(prev => {
      const updated = prev.map(log =>
        log.id === logId ? { ...log, type: `[오탐] ${log.type}`, severity: 'info' as const } : log
      );
      persistLogs(updated);
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        isActive,
        isDetecting,
        currentThreat,
        logs,
        stats,
        settings,
        audioRoute,
        micPermission,
        toggleDetection,
        updateSettings: updateSettingsHandler,
        clearLogs,
        dismissDetection,
        simulateThreat,
        navigateToTab,
        setTabNavigator,
        requestMicPermission,
        markFalsePositive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
