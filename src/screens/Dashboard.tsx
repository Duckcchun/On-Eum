import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated, StyleSheet, Dimensions } from 'react-native';
import { triggerAlert } from '../services/AlertService';
import { startDetection, stopDetection } from '../services/ThreatDetector';

const { width, height } = Dimensions.get('window');

interface DangerLog {
  id: string;
  type: string;
  timestamp: string;
}

interface StatCard {
  title: string;
  value: string;
  color: string;
}

const Dashboard = () => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<DangerLog[]>([]);
  const [stats, setStats] = useState({ totalDetections: 0, activeTime: 0 });
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rmsThreshold = 0.15;

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

  const addLog = (type: string) => {
    const newLog: DangerLog = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toLocaleTimeString('ko-KR'),
    };
    setLogs((prev) => [newLog, ...prev]);
    setStats(prev => ({ ...prev, totalDetections: prev.totalDetections + 1 }));
  };

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    
    if (newState) {
      startDetection(addLog);
    } else {
      stopDetection();
    }
  };

  const simulateThreat = () => {
    addLog('킥보드 접근 감지');
    triggerAlert();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statCards: StatCard[] = [
    { title: '총 감지 횟수', value: stats.totalDetections.toString(), color: '#EF4444' },
    { title: '활동 시간', value: formatTime(stats.activeTime), color: '#3B82F6' },
    { title: '감지 임계값', value: rmsThreshold.toString(), color: '#10B981' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isActive ? '#1a0000' : '#0f172a' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>온음</Text>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#EF4444' : '#10B981' }]}>
            <Text style={styles.statusText}>{isActive ? '활성' : '대기'}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>에어팟 사용자를 위한 스마트 위험음 감지 시스템</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          </View>
        ))}
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
                backgroundColor: isActive ? '#DC2626' : '#059669',
                shadowColor: isActive ? '#EF4444' : '#10B981',
              }
            ]}
          >
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isActive ? 0.5 : 0,
                }
              ]}
            />
            <Text style={styles.buttonText}>{isActive ? 'ON' : 'OFF'}</Text>
            <Text style={styles.buttonSubtext}>안전 모드</Text>
          </TouchableOpacity>
        </Animated.View>

        {isActive && (
          <Animated.Text
            style={[styles.statusText, { opacity: blinkAnim }]}
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
            <Text style={styles.simButtonText}>위협 시뮬레이션</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Logs Section */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>최근 감지 로그</Text>
          <View style={styles.logsBadge}>
            <Text style={styles.logsBadgeText}>{logs.length}</Text>
          </View>
        </View>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.logItem}>
              <View style={styles.logIconContainer}>
                <View style={styles.logIcon} />
              </View>
              <View style={styles.logContent}>
                <Text style={styles.logType}>{item.type}</Text>
                <Text style={styles.logTimestamp}>{item.timestamp}</Text>
              </View>
            </View>
          )}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
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
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
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
    borderColor: '#EF4444',
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
  statusText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  simButton: {
    marginTop: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  simButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  },
  logsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logsList: {
    flex: 1,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
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
});

export default Dashboard;
