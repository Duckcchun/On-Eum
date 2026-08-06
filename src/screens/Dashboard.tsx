import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated, StyleSheet, Dimensions, Alert, SafeAreaView } from 'react-native';
import { triggerAlert, updateAlertSettings } from '../services/AlertService';
import { startDetection, stopDetection } from '../services/ThreatDetector';
import Settings from './Settings';
import Statistics from './Statistics';
import RNFS from 'react-native-fs';

const { width, height } = Dimensions.get('window');

interface DangerLog {
  id: string;
  type: string;
  timestamp: string;
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
}

interface AppSettings {
  rmsThreshold: number;
  hapticEnabled: boolean;
  audioEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

const Dashboard = ({ onResetOnboarding }: { onResetOnboarding: () => void }) => {
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [logs, setLogs] = useState<DangerLog[]>([]);
  const [stats, setStats] = useState({ totalDetections: 0, activeTime: 0 });
  const [settings, setSettings] = useState<AppSettings>({
    rmsThreshold: 0.15,
    hapticEnabled: true,
    audioEnabled: true,
    sensitivity: 'medium',
  });
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const logAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    if (isActive) {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const timer = setInterval(() => {
        setStats(prev => ({ ...prev, activeTime: prev.activeTime + 1 }));
      }, 1000);

      return () => {
        blink.stop();
        pulse.stop();
        clearInterval(timer);
      };
    } else {
      blinkAnim.setValue(1);
      pulseAnim.setValue(0);
    }
  }, [isActive]);

  // 메모리 누수 방지 - 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      Object.keys(logAnimations).forEach(key => {
        delete logAnimations[key];
      });
    };
  }, []);

  const addLog = useCallback((type: string) => {
    const newLog: DangerLog = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toLocaleTimeString('ko-KR'),
    };
    
    // 화면 플래시 효과
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // 로그 애니메이션 초기화
    logAnimations[newLog.id] = new Animated.Value(0);
    
    setLogs((prev) => [newLog, ...prev]);
    setStats(prev => ({ ...prev, totalDetections: prev.totalDetections + 1 }));
    
    // 로그 슬라이드인 애니메이션
    setTimeout(() => {
      Animated.timing(logAnimations[newLog.id], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 50);
  }, [flashAnim, logAnimations]);

  const handleToggle = useCallback(() => {
    const newState = !isActive;
    setIsActive(newState);
    
    if (newState) {
      startDetection(addLog, settings);
    } else {
      stopDetection();
    }
  }, [isActive, settings, addLog]);

  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    updateAlertSettings({
      hapticEnabled: newSettings.hapticEnabled,
      audioEnabled: newSettings.audioEnabled,
    });
  }, []);

  const exportLogs = useCallback(async () => {
    try {
      if (logs.length === 0) {
        Alert.alert('내보내기 실패', '내보낼 로그가 없습니다.');
        return;
      }

      const csvHeader = 'ID,유형,시간\n';
      const csvBody = logs.map(log => `${log.id},${log.type},${log.timestamp}`).join('\n');
      const csvContent = csvHeader + csvBody;

      const path = `${RNFS.DocumentDirectoryPath}/on_eum_logs_${Date.now()}.csv`;
      await RNFS.writeFile(path, csvContent, 'utf8');

      Alert.alert(
        '내보내기 성공',
        `로그가 저장되었습니다:\n${path}`,
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('Error exporting logs:', error);
      Alert.alert('내보내기 실패', '로그 내보내기 중 오류가 발생했습니다.');
    }
  }, [logs]);

  const simulateThreat = useCallback(() => {
    addLog('킥보드 접근 감지');
    triggerAlert();
  }, [addLog]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const statCards: StatCard[] = useMemo(() => [
    { title: '총 감지 횟수', value: stats.totalDetections.toString(), icon: '🚨' },
    { title: '활동 시간', value: formatTime(stats.activeTime), icon: '⏱️' },
    { title: '감지 임계값', value: settings.rmsThreshold.toString(), icon: '🎚️' },
  ], [stats.totalDetections, stats.activeTime, settings.rmsThreshold, formatTime]);

  if (showSettings) {
    return (
      <Settings
        onBack={() => setShowSettings(false)}
        onSettingsChange={handleSettingsChange}
        onResetOnboarding={onResetOnboarding}
      />
    );
  }

  if (showStatistics) {
    return (
      <Statistics
        logs={logs}
        totalDetections={stats.totalDetections}
        activeTime={stats.activeTime}
        onBack={() => setShowStatistics(false)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#0f172a' }]}>
      <View style={[styles.container, { backgroundColor: '#0f172a' }]}>
        {/* 감지 플래시 효과 */}
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashAnim,
            },
          ]}
        />
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View>
            <Text style={styles.title}>온음</Text>
            <Text style={styles.subtitle}>에어팟 사용자를 위한 스마트 위험음 감지 시스템</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: isActive ? '#10B981' : '#6B7280', borderWidth: 2, backgroundColor: 'transparent' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#10B981' : '#9CA3AF' }]}>{isActive ? '감지 중' : '대기'}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowStatistics(true)} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => {
          const isDetectionCount = stat.title === '총 감지 횟수';
          return (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)' }]}>
                <Text style={[styles.statIcon, { color: isActive ? '#10B981' : '#9CA3AF' }]}>{stat.icon}</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statTitle, { color: isActive ? '#94A3B8' : '#6B7280' }]}>{stat.title}</Text>
                <Text style={[styles.statValue, { color: isDetectionCount ? '#EF4444' : (isActive ? '#FFFFFF' : '#9CA3AF') }]}>{stat.value}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Main Button */}
      <View style={styles.buttonContainer}>
        <Animated.View style={{ opacity: blinkAnim }}>
          <TouchableOpacity
            onPress={handleToggle}
            activeOpacity={0.8}
            style={[
              styles.mainButton,
              {
                backgroundColor: isActive ? '#10B981' : '#374151',
                shadowColor: isActive ? '#10B981' : '#374151',
                borderWidth: isActive ? 0 : 2,
                borderColor: '#4B5563',
              }
            ]}
          >
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isActive ? 0.5 : 0,
                  borderColor: isActive ? '#10B981' : '#374151',
                }
              ]}
            />
            <Text style={[styles.buttonText, { color: isActive ? '#FFFFFF' : '#E5E7EB' }]}>{isActive ? 'ON' : 'OFF'}</Text>
            <Text style={styles.buttonSubtext}>안전 모드</Text>
          </TouchableOpacity>
        </Animated.View>

        {isActive && (
          <Animated.Text
            style={[styles.detectionStatusText, { opacity: blinkAnim }]}
          >
            위험음 감지 중...
          </Animated.Text>
        )}

        {isActive && (
          <TouchableOpacity
            onPress={simulateThreat}
            style={styles.simButton}
            activeOpacity={0.7}
          >
            <Text style={styles.simButtonText}>시뮬레이션</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Logs Section */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>최근 감지 로그</Text>
          <View style={styles.logsHeaderRight}>
            <View style={styles.logsBadge}>
              <Text style={styles.logsBadgeText}>{logs.length}</Text>
            </View>
            {logs.length > 0 && (
              <TouchableOpacity onPress={exportLogs} style={styles.exportButton}>
                <Text style={styles.exportButtonText}>내보내기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const anim = logAnimations[item.id] || new Animated.Value(1);
            return (
              <Animated.View
                style={[
                  styles.logItem,
                  {
                    opacity: anim,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.logIconContainer}>
                  <Text style={styles.logIcon}>⚠️</Text>
                </View>
                <View style={styles.logContent}>
                  <Text style={styles.logType}>{item.type}</Text>
                  <Text style={styles.logTimestamp}>{item.timestamp}</Text>
                </View>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyLogs}>
              <Text style={styles.emptyLogsText}>감지 기록 없음</Text>
              <Text style={styles.emptyLogsSubtext}>안전 모드를 활성화하여 감지를 시작하세요</Text>
            </View>
          }
          style={styles.logsList}
        />
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '400',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mainButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
  },
  buttonText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.9,
  },
  detectionStatusText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  simButton: {
    marginTop: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  simButtonText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logsBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  logsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  exportButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  exportButtonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  logsList: {
    flex: 1,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logIcon: {
    fontSize: 20,
  },
  logContent: {
    flex: 1,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyLogs: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyLogsText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyLogsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    pointerEvents: 'none',
    zIndex: 1000,
  },
});

export default Dashboard;
