import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  DetectionLocation,
  HotspotZone,
  loadDetectionLocations,
  calculateHotspots,
  getLocationStats,
} from '../services/LocationService';
import { useApp } from '../context/AppContext';

// ─── Hotspot Card ───
const HotspotCard: React.FC<{ hotspot: HotspotZone; index: number }> = ({ hotspot, index }) => {
  const threatIcons: Record<string, string> = {
    '전동 킥보드 접근 감지': '🛴',
    '오토바이 접근 감지': '🏍️',
    '차량 접근 감지': '🚗',
    '경적 소리 감지': '📢',
  };
  const icon = threatIcons[hotspot.primaryThreatType] || '⚠️';

  return (
    <View style={styles.hotspotCard}>
      <View style={styles.hotspotRank}>
        <Text style={styles.hotspotRankText}>#{index + 1}</Text>
      </View>
      <View style={styles.hotspotContent}>
        <View style={styles.hotspotHeader}>
          <Text style={styles.hotspotIcon}>{icon}</Text>
          <View style={styles.hotspotInfo}>
            <Text style={styles.hotspotTitle}>위험 지점</Text>
            <Text style={styles.hotspotSubtitle}>
              {hotspot.detectionCount}회 감지 · {hotspot.primaryThreatType.replace(' 감지', '')}
            </Text>
          </View>
          <View style={styles.hotspotBadge}>
            <Text style={styles.hotspotBadgeText}>{hotspot.detectionCount}회</Text>
          </View>
        </View>
        <Text style={styles.hotspotDate}>마지막: {hotspot.lastDetected}</Text>
      </View>
    </View>
  );
};

// ─── Location Log Card ───
const LocationLogCard: React.FC<{ detection: DetectionLocation }> = ({ detection }) => {
  const severityConfig = {
    danger: { color: '#EF4444', icon: '🛴', label: '위험' },
    warning: { color: '#F59E0B', icon: '🏍️', label: '주의' },
    info: { color: '#3B82F6', icon: '🔔', label: '알림' },
  };
  const config = severityConfig[detection.severity];

  return (
    <View style={styles.locationLog}>
      <View style={[styles.locationLogIcon, { backgroundColor: `${config.color}15` }]}>
        <Text style={styles.locationLogIconText}>{config.icon}</Text>
      </View>
      <View style={styles.locationLogContent}>
        <Text style={styles.locationLogType}>{detection.threatType}</Text>
        <Text style={styles.locationLogMeta}>
          📍 {detection.location.latitude.toFixed(4)}, {detection.location.longitude.toFixed(4)}
        </Text>
        <Text style={styles.locationLogDate}>{detection.date}</Text>
      </View>
    </View>
  );
};

// ─── Main MapScreen ───
const MapScreen: React.FC = () => {
  const { logs } = useApp();
  const [locations, setLocations] = useState<DetectionLocation[]>([]);
  const [activeView, setActiveView] = useState<'hotspots' | 'list' | 'stats'>('hotspots');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const saved = await loadDetectionLocations();
    setLocations(saved);
  };

  const hotspots = useMemo(() => calculateHotspots(locations), [locations]);
  const stats = useMemo(() => getLocationStats(locations), [locations]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>위험 지도</Text>
        <Text style={styles.subtitle}>감지된 위험 지점들을 확인하세요</Text>

        {/* Map placeholder */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapText}>위치 기반 히트맵</Text>
            <Text style={styles.mapSubText}>
              위치 권한을 허용하면{'\n'}감지 지점이 지도에 표시됩니다
            </Text>
          </View>
          {/* Mini grid to simulate map */}
          <View style={styles.mapGrid}>
            {Array.from({ length: 16 }).map((_, i) => (
              <View key={i} style={styles.mapGridCell} />
            ))}
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {[
            { key: 'hotspots' as const, label: '위험 지점', count: hotspots.length },
            { key: 'list' as const, label: '기록', count: locations.length },
            { key: 'stats' as const, label: '통계', count: null },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeView === tab.key && styles.tabActive]}
              onPress={() => setActiveView(tab.key)}
            >
              <Text style={[styles.tabText, activeView === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== null && (
                <View style={[styles.tabBadge, activeView === tab.key && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on active view */}
        {activeView === 'hotspots' && (
          <View style={styles.section}>
            {hotspots.length > 0 ? (
              hotspots.map((hotspot, index) => (
                <HotspotCard key={index} hotspot={hotspot} index={index} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📍</Text>
                <Text style={styles.emptyTitle}>위험 지점이 없습니다</Text>
                <Text style={styles.emptySubtitle}>
                  위치 권한을 허용하고 보호 모드를 사용하면{'\n'}감지된 위험 지점이 여기에 표시됩니다
                </Text>
              </View>
            )}
          </View>
        )}

        {activeView === 'list' && (
          <View style={styles.section}>
            {locations.length > 0 ? (
              locations.slice(0, 20).map(loc => (
                <LocationLogCard key={loc.id} detection={loc} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>위치 기록이 없습니다</Text>
                <Text style={styles.emptySubtitle}>
                  위치 기반 감지 기록이 여기에 표시됩니다
                </Text>
              </View>
            )}
          </View>
        )}

        {activeView === 'stats' && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalPoints}</Text>
                <Text style={styles.statLabel}>총 위치 기록</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.uniqueDays}</Text>
                <Text style={styles.statLabel}>활동 일수</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.dangerCount}</Text>
                <Text style={styles.statLabel}>위험 감지</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.warningCount}</Text>
                <Text style={styles.statLabel}>주의 감지</Text>
              </View>
            </View>

            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>💡 위치 인사이트</Text>
              <Text style={styles.insightText}>
                • 일 평균 {stats.avgPerDay}건의 위험이 감지되었습니다{'\n'}
                • 총 {hotspots.length}개의 위험 집중 지역이 발견되었습니다{'\n'}
                • 위치 데이터가 쌓일수록 더 정확한 분석이 가능합니다
              </Text>
            </View>
          </View>
        )}

        {/* Setup guide */}
        <View style={styles.setupCard}>
          <Text style={styles.setupIcon}>📱</Text>
          <View style={styles.setupContent}>
            <Text style={styles.setupTitle}>위치 기능 활성화하기</Text>
            <Text style={styles.setupText}>
              1. 설정 → 개인정보 → 위치 서비스{'\n'}
              2. 온음 앱 → "앱 사용 중" 선택{'\n'}
              3. 보호 모드 켜면 자동으로 위치 기록
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
    marginBottom: 20,
  },

  // Map placeholder
  mapPlaceholder: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    zIndex: 2,
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mapSubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.3,
  },
  mapGridCell: {
    width: '25%',
    height: '25%',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#10B981',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Section
  section: {
    marginBottom: 20,
  },

  // Hotspot
  hotspotCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  hotspotRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  hotspotRankText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  hotspotContent: {
    flex: 1,
  },
  hotspotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hotspotIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  hotspotInfo: {
    flex: 1,
  },
  hotspotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hotspotSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  hotspotBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotspotBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  hotspotDate: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },

  // Location Log
  locationLog: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  locationLogIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationLogIconText: {
    fontSize: 18,
  },
  locationLogContent: {
    flex: 1,
  },
  locationLogType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  locationLogMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  locationLogDate: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  insightBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.12)',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6EE7B7',
    marginBottom: 10,
  },
  insightText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 22,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Setup card
  setupCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  setupIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  setupContent: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  setupText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 20,
  },
});

export default MapScreen;
