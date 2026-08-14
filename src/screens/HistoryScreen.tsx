import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useApp, DetectionLog } from '../context/AppContext';
import RNFS from 'react-native-fs';

// ─── Helper: Group logs by date ───
const groupLogsByDate = (logs: DetectionLog[]) => {
  const groups: { [date: string]: DetectionLog[] } = {};
  logs.forEach(log => {
    if (!groups[log.date]) groups[log.date] = [];
    groups[log.date].push(log);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
};

// ─── Log Card Component ───
const LogCard: React.FC<{ log: DetectionLog }> = ({ log }) => {
  const severityConfig = {
    danger: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', icon: '🛴', label: '위험', border: 'rgba(239, 68, 68, 0.2)' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', icon: '🏍️', label: '주의', border: 'rgba(245, 158, 11, 0.2)' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', icon: '🔔', label: '알림', border: 'rgba(59, 130, 246, 0.2)' },
  };
  const config = severityConfig[log.severity];

  return (
    <View style={[styles.logCard, { borderLeftColor: config.color }]}>
      <View style={styles.logCardLeft}>
        <View style={[styles.logCardIcon, { backgroundColor: config.bg }]}>
          <Text style={styles.logCardIconText}>{config.icon}</Text>
        </View>
        <View style={styles.logCardContent}>
          <View style={styles.logCardHeader}>
            <Text style={styles.logCardType}>{log.type}</Text>
            <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
              <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={styles.logCardTime}>⏰ {log.timestamp}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main HistoryScreen ───
const HistoryScreen: React.FC = () => {
  const { logs, stats, clearLogs } = useApp();

  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);

  const exportLogs = useCallback(async () => {
    try {
      if (logs.length === 0) {
        Alert.alert('내보내기 실패', '내보낼 로그가 없습니다.');
        return;
      }
      const csvHeader = '날짜,시간,유형,위험등급\n';
      const csvBody = logs
        .map(log => `${log.date},${log.timestamp},${log.type},${log.severity}`)
        .join('\n');
      const path = `${RNFS.DocumentDirectoryPath}/on_eum_logs_${Date.now()}.csv`;
      await RNFS.writeFile(path, csvHeader + csvBody, 'utf8');
      Alert.alert('내보내기 성공', `로그가 CSV로 저장되었습니다.`);
    } catch (error) {
      Alert.alert('오류', '로그 내보내기 중 오류가 발생했습니다.');
    }
  }, [logs]);

  const handleClear = () => {
    Alert.alert('기록 삭제', '모든 감지 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: clearLogs },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>감지 기록</Text>
        <View style={styles.headerActions}>
          {logs.length > 0 && (
            <>
              <TouchableOpacity onPress={exportLogs} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>📤 내보내기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear} style={[styles.actionBtn, styles.dangerBtn]}>
                <Text style={[styles.actionBtnText, styles.dangerBtnText]}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.totalDetections}</Text>
          <Text style={styles.summaryLabel}>총 감지</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.todayDetections}</Text>
          <Text style={styles.summaryLabel}>오늘</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {stats.activeTime >= 3600
              ? `${Math.floor(stats.activeTime / 3600)}h`
              : `${Math.floor(stats.activeTime / 60)}m`}
          </Text>
          <Text style={styles.summaryLabel}>활동 시간</Text>
        </View>
      </View>

      {/* Log List */}
      {logs.length > 0 ? (
        <FlatList
          data={groupedLogs}
          keyExtractor={item => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: group }) => (
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>{group.date}</Text>
              {group.items.map(log => (
                <LogCard key={log.id} log={log} />
              ))}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>기록이 없습니다</Text>
          <Text style={styles.emptySubtitle}>
            보호 모드를 활성화하면{'\n'}감지 기록이 여기에 표시됩니다
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dangerBtn: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  dangerBtnText: {
    color: '#EF4444',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    paddingLeft: 4,
  },
  logCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logCardIconText: {
    fontSize: 22,
  },
  logCardContent: {
    flex: 1,
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logCardType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logCardTime: {
    fontSize: 12,
    color: '#64748B',
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HistoryScreen;
