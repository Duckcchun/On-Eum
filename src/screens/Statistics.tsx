import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface StatisticsProps {
  logs: Array<{ id: string; type: string; timestamp: string }>;
  totalDetections: number;
  activeTime: number;
  onBack: () => void;
}

const Statistics = ({ logs, totalDetections, activeTime, onBack }: StatisticsProps) => {
  const calculateAverageDetectionsPerHour = () => {
    if (activeTime === 0) return 0;
    const hours = activeTime / 3600;
    return (totalDetections / hours).toFixed(2);
  };

  const calculateDetectionRate = () => {
    if (activeTime === 0) return 0;
    return ((totalDetections / activeTime) * 60).toFixed(2); // detections per minute
  };

  const getRecentActivity = () => {
    if (logs.length === 0) return '없음';
    const lastLog = logs[0];
    const now = new Date();
    const logTime = new Date(lastLog.timestamp);
    const diffMinutes = Math.floor((now.getTime() - logTime.getTime()) / 60000);
    
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}시간 전`;
    return `${Math.floor(diffMinutes / 1440)}일 전`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${secs}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>통계 분석</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 기본 통계 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 통계</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>총 감지 횟수</Text>
            <Text style={styles.statValue}>{totalDetections}회</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>총 활동 시간</Text>
            <Text style={styles.statValue}>{formatTime(activeTime)}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>시간당 평균 감지</Text>
            <Text style={styles.statValue}>{calculateAverageDetectionsPerHour()}회/시간</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>분당 감지율</Text>
            <Text style={styles.statValue}>{calculateDetectionRate()}회/분</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>마지막 감지</Text>
            <Text style={styles.statValue}>{getRecentActivity()}</Text>
          </View>
        </View>

        {/* 감지 패턴 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>감지 패턴</Text>
          
          <View style={styles.patternContainer}>
            <View style={styles.patternItem}>
              <View style={styles.patternIcon}>
                <Text style={styles.patternIconText}>📊</Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={styles.patternLabel}>감지 빈도</Text>
                <Text style={styles.patternValue}>
                  {totalDetections > 10 ? '높음' : totalDetections > 5 ? '중간' : '낮음'}
                </Text>
              </View>
            </View>
            
            <View style={styles.patternItem}>
              <View style={styles.patternIcon}>
                <Text style={styles.patternIconText}>⏱️</Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={styles.patternLabel}>활동 강도</Text>
                <Text style={styles.patternValue}>
                  {activeTime > 3600 ? '높음' : activeTime > 1800 ? '중간' : '낮음'}
                </Text>
              </View>
            </View>
            
            <View style={styles.patternItem}>
              <View style={styles.patternIcon}>
                <Text style={styles.patternIconText}>🎯</Text>
              </View>
              <View style={styles.patternInfo}>
                <Text style={styles.patternLabel}>감지 정확도</Text>
                <Text style={styles.patternValue}>높음</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 팁 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>안전 팁</Text>
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              • 감지 빈도가 높으면 임계값을 낮춰보세요
            </Text>
            <Text style={styles.tipText}>
              • 활동 시간이 길면 정기적으로 휴식을 취하세요
            </Text>
            <Text style={styles.tipText}>
              • 주변 환경에 따라 감지 민감도를 조절하세요
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 16,
    color: '#94A3B8',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  patternContainer: {
    gap: 12,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  patternIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  patternIconText: {
    fontSize: 24,
  },
  patternInfo: {
    flex: 1,
  },
  patternLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  patternValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipContainer: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});

export default Statistics;
