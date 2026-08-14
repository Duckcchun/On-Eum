import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';

// ─── Stat Ring Component ───
const StatRing: React.FC<{
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  color: string;
}> = ({ value, maxValue, label, unit, color }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <View style={styles.ringCard}>
      <View style={styles.ringContainer}>
        {/* Background ring */}
        <View style={[styles.ringBg, { borderColor: 'rgba(255,255,255,0.06)' }]} />
        {/* Value in center */}
        <Text style={[styles.ringValue, { color }]}>{value}</Text>
        <Text style={[styles.ringUnit, { color }]}>{unit}</Text>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
      {/* Progress bar below */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
};

// ─── Insight Card ───
const InsightCard: React.FC<{
  icon: string;
  title: string;
  value: string;
  description: string;
  color: string;
}> = ({ icon, title, value, description, color }) => (
  <View style={styles.insightCard}>
    <View style={[styles.insightIcon, { backgroundColor: `${color}15` }]}>
      <Text style={styles.insightIconText}>{icon}</Text>
    </View>
    <View style={styles.insightContent}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={[styles.insightValue, { color }]}>{value}</Text>
      <Text style={styles.insightDescription}>{description}</Text>
    </View>
  </View>
);

// ─── Main StatsScreen ───
const StatsScreen: React.FC = () => {
  const { logs, stats } = useApp();

  const analytics = useMemo(() => {
    const hours = stats.activeTime / 3600;
    const detectionsPerHour = hours > 0 ? (stats.totalDetections / hours).toFixed(1) : '0';
    const dangerCount = logs.filter(l => l.severity === 'danger').length;
    const warningCount = logs.filter(l => l.severity === 'warning').length;
    const avgPerDay = stats.totalDetections > 0 ? (stats.totalDetections / Math.max(1, Math.ceil(hours / 24))).toFixed(1) : '0';

    let safetyScore = 100;
    if (stats.totalDetections > 0) {
      safetyScore = Math.max(0, 100 - stats.totalDetections * 3);
    }

    return {
      detectionsPerHour,
      dangerCount,
      warningCount,
      avgPerDay,
      safetyScore,
      totalHours: hours.toFixed(1),
    };
  }, [logs, stats]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>통계</Text>
        <Text style={styles.subtitle}>감지 활동에 대한 분석 데이터입니다</Text>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <StatRing
            value={stats.totalDetections}
            maxValue={50}
            label="총 감지"
            unit="회"
            color="#EF4444"
          />
          <StatRing
            value={parseInt(analytics.totalHours)}
            maxValue={100}
            label="활동 시간"
            unit="시간"
            color="#10B981"
          />
          <StatRing
            value={analytics.safetyScore}
            maxValue={100}
            label="안전 점수"
            unit="점"
            color={analytics.safetyScore >= 70 ? '#10B981' : analytics.safetyScore >= 40 ? '#F59E0B' : '#EF4444'}
          />
        </View>

        {/* Activity Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>활동 요약</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{formatTime(stats.activeTime)}</Text>
              <Text style={styles.summaryItemLabel}>총 활동 시간</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{analytics.detectionsPerHour}/h</Text>
              <Text style={styles.summaryItemLabel}>시간당 감지</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{analytics.avgPerDay}</Text>
              <Text style={styles.summaryItemLabel}>일평균 감지</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{stats.todayDetections}</Text>
              <Text style={styles.summaryItemLabel}>오늘 감지</Text>
            </View>
          </View>
        </View>

        {/* Detection Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>위험 유형 분석</Text>

          <View style={styles.typeRow}>
            <View style={[styles.typeCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={styles.typeIcon}>🛴</Text>
              <View>
                <Text style={styles.typeLabel}>킥보드 감지</Text>
                <Text style={[styles.typeValue, { color: '#EF4444' }]}>{analytics.dangerCount}건</Text>
              </View>
            </View>
            <View style={[styles.typeCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={styles.typeIcon}>🏍️</Text>
              <View>
                <Text style={styles.typeLabel}>오토바이 감지</Text>
                <Text style={[styles.typeValue, { color: '#F59E0B' }]}>{analytics.warningCount}건</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인사이트</Text>

          <InsightCard
            icon="📊"
            title="감지 빈도"
            value={
              stats.totalDetections > 10
                ? '높음'
                : stats.totalDetections > 5
                ? '보통'
                : '낮음'
            }
            description="최근 활동 기준 분석"
            color={stats.totalDetections > 10 ? '#EF4444' : stats.totalDetections > 5 ? '#F59E0B' : '#10B981'}
          />

          <InsightCard
            icon="⏱️"
            title="활동 강도"
            value={
              stats.activeTime > 7200
                ? '매우 활발'
                : stats.activeTime > 3600
                ? '활발'
                : '보통'
            }
            description="보호 모드 사용 시간 기준"
            color="#3B82F6"
          />

          <InsightCard
            icon="🛡️"
            title="안전 등급"
            value={
              analytics.safetyScore >= 80
                ? 'A등급 (안전)'
                : analytics.safetyScore >= 60
                ? 'B등급 (양호)'
                : analytics.safetyScore >= 40
                ? 'C등급 (주의)'
                : 'D등급 (위험)'
            }
            description="감지 횟수 기반 안전 점수"
            color={
              analytics.safetyScore >= 80
                ? '#10B981'
                : analytics.safetyScore >= 60
                ? '#3B82F6'
                : analytics.safetyScore >= 40
                ? '#F59E0B'
                : '#EF4444'
            }
          />
        </View>

        {/* Tips */}
        <View style={styles.tipSection}>
          <Text style={styles.tipTitle}>💡 안전 팁</Text>
          <Text style={styles.tipText}>
            • 감지가 많은 시간대에는 노이즈 캔슬링 강도를 낮춰보세요{'\n'}
            • 주기적으로 임계값을 환경에 맞게 조절하세요{'\n'}
            • 횡단보도 이용 시에는 잠시 모드를 해제하세요
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 28,
  },

  // Main Stats
  mainStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  ringCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ringContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ringBg: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
  },
  ringValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  ringUnit: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  ringLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  // Section
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#64748B',
  },

  // Type Cards
  typeRow: {
    gap: 12,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  typeValue: {
    fontSize: 20,
    fontWeight: '800',
  },

  // Insights
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  insightIconText: {
    fontSize: 20,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 12,
    color: '#475569',
  },

  // Tips
  tipSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.12)',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6EE7B7',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 22,
  },
});

export default StatsScreen;
