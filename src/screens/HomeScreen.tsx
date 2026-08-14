import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useApp, ThreatInfo } from '../context/AppContext';

const { width } = Dimensions.get('window');

// ─── Radar Animation Component ───
const RadarCircle: React.FC<{ isActive: boolean; isDetecting: boolean; threatIcon?: string }> = ({
  isActive,
  isDetecting,
  threatIcon,
}) => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      const createPulse = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        );

      createPulse(pulse1, 0).start();
      createPulse(pulse2, 600).start();
      createPulse(pulse3, 1200).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);
      glowAnim.setValue(0);
    }
  }, [isActive]);

  const color = isDetecting ? '#EF4444' : '#10B981';
  const bgColor = isDetecting ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)';

  const renderPulse = (anim: Animated.Value, size: number) => (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0],
          }),
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.8],
              }),
            },
          ],
        },
      ]}
    />
  );

  return (
    <View style={styles.radarContainer}>
      {/* Background glow */}
      <Animated.View
        style={[
          styles.radarGlow,
          {
            backgroundColor: bgColor,
            opacity: isActive ? glowAnim : 0,
          },
        ]}
      />

      {/* Pulse rings */}
      {isActive && renderPulse(pulse1, 200)}
      {isActive && renderPulse(pulse2, 200)}
      {isActive && renderPulse(pulse3, 200)}

      {/* Center circle */}
      <View
        style={[
          styles.radarCenter,
          {
            borderColor: color,
            backgroundColor: isDetecting
              ? 'rgba(239, 68, 68, 0.15)'
              : isActive
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(255,255,255,0.03)',
          },
        ]}
      >
        {/* Icon */}
        <Text style={styles.radarIcon}>
          {isDetecting ? (threatIcon || '🛴') : '🎧'}
        </Text>

        {/* Status text */}
        <Text style={[styles.radarStatus, { color }]}>
          {isDetecting ? 'DANGER' : isActive ? 'SAFE' : 'OFF'}
        </Text>
        <Text style={[styles.radarSubStatus, { color: isDetecting ? '#FCA5A5' : isActive ? '#6EE7B7' : '#6B7280' }]}>
          {isDetecting ? '위험 감지됨' : isActive ? 'Listening...' : '비활성'}
        </Text>
      </View>
    </View>
  );
};

// ─── Direction Indicator ───
const DirectionIndicator: React.FC<{ direction: number }> = ({ direction }) => {
  // direction: -1.0 (left) ~ 0.0 (center) ~ 1.0 (right)
  const getDirectionLabel = () => {
    if (direction < -0.3) return '좌측';
    if (direction > 0.3) return '우측';
    return '정면/후방';
  };

  const getDirectionIcon = () => {
    if (direction < -0.3) return '←';
    if (direction > 0.3) return '→';
    return '↕';
  };

  // Indicator dot position (0% = left, 50% = center, 100% = right)
  const dotPosition = ((direction + 1) / 2) * 100;

  return (
    <View style={styles.directionCard}>
      <View style={styles.directionHeader}>
        <Text style={styles.directionIcon}>🧭</Text>
        <Text style={styles.directionTitle}>위험 방향</Text>
      </View>

      {/* Direction label */}
      <Text style={styles.directionLabel}>
        {getDirectionIcon()} {getDirectionLabel()}
      </Text>

      {/* Visual direction bar */}
      <View style={styles.directionBarContainer}>
        <Text style={styles.directionBarLabel}>L</Text>
        <View style={styles.directionBar}>
          {/* Center marker */}
          <View style={styles.directionBarCenter} />
          {/* Dot indicator */}
          <View
            style={[
              styles.directionDot,
              { left: `${Math.max(5, Math.min(95, dotPosition))}%` },
            ]}
          />
          {/* Colored zone */}
          {direction < -0.3 && (
            <View style={[styles.directionZone, styles.directionZoneLeft, { width: `${Math.abs(direction) * 50}%` }]} />
          )}
          {direction > 0.3 && (
            <View style={[styles.directionZone, styles.directionZoneRight, { width: `${Math.abs(direction) * 50}%` }]} />
          )}
        </View>
        <Text style={styles.directionBarLabel}>R</Text>
      </View>

      <Text style={styles.directionNote}>
        ※ 스테레오 마이크 기반 추정 (참고용)
      </Text>
    </View>
  );
};

// ─── Threat Detail Card ───
const ThreatDetailCard: React.FC<{
  threat: ThreatInfo;
  onDismiss: () => void;
  onFalsePositive: () => void;
}> = ({ threat, onDismiss, onFalsePositive }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.threatCard,
        {
          opacity: slideAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        },
      ]}
    >
      {/* Threat header */}
      <View style={styles.threatHeader}>
        <View style={styles.threatHeaderLeft}>
          <View style={styles.threatIconBig}>
            <Text style={styles.threatIconBigText}>{threat.icon}</Text>
          </View>
          <View>
            <Text style={styles.threatType}>{threat.type}</Text>
            <Text style={styles.threatTime}>감지 시각: {threat.detectedAt}</Text>
          </View>
        </View>
        <View style={[
          styles.threatSeverityBadge,
          { backgroundColor: threat.severity === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)' }
        ]}>
          <Text style={[
            styles.threatSeverityText,
            { color: threat.severity === 'danger' ? '#EF4444' : '#F59E0B' }
          ]}>
            {threat.severity === 'danger' ? '위험' : '주의'}
          </Text>
        </View>
      </View>

      {/* Real-time status indicators */}
      <View style={styles.threatStatusRow}>
        <View style={styles.threatStatusItem}>
          <Text style={styles.threatStatusIcon}>📳</Text>
          <View>
            <Text style={styles.threatStatusLabel}>에어팟 경고음</Text>
            <Text style={styles.threatStatusValue}>전송 중</Text>
          </View>
          <View style={styles.waveSmall}>
            {[1,2,3,4].map(i => (
              <View key={i} style={[styles.waveBarSmall, { height: 4 + Math.random() * 8 }]} />
            ))}
          </View>
        </View>

        <View style={styles.threatStatusItem}>
          <Text style={styles.threatStatusIcon}>📳</Text>
          <View>
            <Text style={styles.threatStatusLabel}>진동 경고</Text>
            <Text style={styles.threatStatusValue}>전송 중</Text>
          </View>
          <View style={styles.vibrationDots}>
            {[1,2,3].map(i => (
              <View key={i} style={styles.vibrationDot} />
            ))}
          </View>
        </View>
      </View>

      {/* Direction indicator */}
      <DirectionIndicator direction={threat.direction} />

      {/* Dismiss button */}
      <View style={styles.threatActions}>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissBtnIcon}>✅</Text>
          <Text style={styles.dismissBtnText}>안전해졌어요</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onFalsePositive} style={styles.falsePositiveBtn}>
          <Text style={styles.falsePositiveBtnIcon}>❌</Text>
          <Text style={styles.falsePositiveBtnText}>오탐이에요</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Simulation Panel ───
const SimulationPanel: React.FC<{
  onSimulate: (type: 'kickboard' | 'motorcycle' | 'vehicle' | 'horn') => void;
}> = ({ onSimulate }) => {
  const simOptions = [
    { key: 'kickboard' as const, icon: '🛴', label: '킥보드' },
    { key: 'motorcycle' as const, icon: '🏍️', label: '오토바이' },
    { key: 'vehicle' as const, icon: '🚗', label: '차량' },
    { key: 'horn' as const, icon: '📢', label: '경적' },
  ];

  return (
    <View style={styles.simPanel}>
      <View style={styles.simHeader}>
        <Text style={styles.simHeaderIcon}>🧪</Text>
        <Text style={styles.simHeaderText}>시뮬레이션</Text>
        <View style={styles.simDevBadge}>
          <Text style={styles.simDevBadgeText}>DEV</Text>
        </View>
      </View>
      <View style={styles.simGrid}>
        {simOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={styles.simBtn}
            onPress={() => onSimulate(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.simBtnIcon}>{opt.icon}</Text>
            <Text style={styles.simBtnLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Status Card ───
const StatusCard: React.FC<{
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <View style={styles.statusCard}>
    <Text style={styles.statusCardIcon}>{icon}</Text>
    <Text style={styles.statusCardTitle}>{title}</Text>
    <Text style={[styles.statusCardValue, { color }]}>{value}</Text>
    <View style={styles.statusDot}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.statusCardSubtitle, { color }]}>{subtitle}</Text>
    </View>
  </View>
);

// ─── Detection Log Item ───
const LogItem: React.FC<{
  type: string;
  timestamp: string;
  severity: 'danger' | 'warning' | 'info';
}> = ({ type, timestamp, severity }) => {
  const severityConfig = {
    danger: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', icon: '🛴', label: '위험' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', icon: '🏍️', label: '주의' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', icon: '🔔', label: '알림' },
  };
  const config = severityConfig[severity];

  return (
    <View style={styles.logItem}>
      <View style={[styles.logIcon, { backgroundColor: config.bg }]}>
        <Text style={styles.logIconText}>{config.icon}</Text>
      </View>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <Text style={styles.logType}>{type}</Text>
          <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.severityText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <Text style={styles.logTimestamp}>오늘 {timestamp}</Text>
      </View>
    </View>
  );
};

// ─── Main HomeScreen ───
const HomeScreen: React.FC = () => {
  const {
    isActive,
    isDetecting,
    currentThreat,
    logs,
    stats,
    audioRoute,
    toggleDetection,
    dismissDetection,
    simulateThreat,
    navigateToTab,
    markFalsePositive,
  } = useApp();
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [showSimPanel, setShowSimPanel] = useState(false);

  useEffect(() => {
    if (isDetecting) {
      flashAnim.setValue(1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isDetecting, logs.length]);

  const recentLogs = logs.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Flash overlay on detection */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashAnim }]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>온음</Text>
            <Text style={styles.appSubtitle}>
              AI가 당신의 주변 소리를 듣고{'\n'}위험을 미리 알려드려요
            </Text>
          </View>
          {/* Protection mode badge */}
          <TouchableOpacity
            onPress={toggleDetection}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.modeBadge,
              {
                backgroundColor: isActive
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(107, 114, 128, 0.15)',
                borderColor: isActive ? '#10B981' : '#4B5563',
              },
            ]}
          >
            <Text style={styles.modeBadgeIcon}>{isActive ? '🛡️' : '⏸️'}</Text>
            <Text
              style={[
                styles.modeBadgeText,
                { color: isActive ? '#10B981' : '#9CA3AF' },
              ]}
            >
              {isActive ? '활성화' : '비활성'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detection Alert Banner */}
        {isDetecting && currentThreat && (
          <View style={styles.alertBanner}>
            <View style={styles.alertBannerLeft}>
              <Text style={styles.alertBannerIcon}>⚠️</Text>
              <View>
                <Text style={styles.alertBannerTitle}>위험 감지!</Text>
                <Text style={styles.alertBannerSubtitle}>
                  {currentThreat.type.replace(' 감지', '')}이 감지되었습니다.
                </Text>
              </View>
            </View>
            <Text style={styles.alertBannerTime}>{currentThreat.detectedAt}</Text>
          </View>
        )}

        {/* Radar */}
        <RadarCircle
          isActive={isActive}
          isDetecting={isDetecting}
          threatIcon={currentThreat?.icon}
        />

        {/* Threat Detail Card - shown during detection */}
        {isDetecting && currentThreat && (
          <ThreatDetailCard
            threat={currentThreat}
            onDismiss={dismissDetection}
            onFalsePositive={() => {
              if (logs.length > 0) {
                markFalsePositive(logs[0].id);
              }
              dismissDetection();
            }}
          />
        )}

        {/* Listening indicator */}
        {isActive && !isDetecting && (
          <View style={styles.listeningIndicator}>
            <View style={styles.soundWave}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <View
                  key={i}
                  style={[
                    styles.soundBar,
                    {
                      height: 4 + (i % 3) * 4,
                      opacity: 0.4 + (i % 3) * 0.2,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.listeningText}>AI가 주변 소리를 분석하고 있습니다</Text>
          </View>
        )}

        {/* Simulation Panel - shown when active (DEV only) */}
        {__DEV__ && isActive && (
          <View>
            <TouchableOpacity
              style={styles.simToggle}
              onPress={() => setShowSimPanel(!showSimPanel)}
              activeOpacity={0.7}
            >
              <Text style={styles.simToggleText}>
                {showSimPanel ? '🧪 시뮬레이션 닫기' : '🧪 시뮬레이션 열기'}
              </Text>
            </TouchableOpacity>

            {showSimPanel && (
              <SimulationPanel onSimulate={simulateThreat} />
            )}
          </View>
        )}

        {/* Status Cards */}
        <View style={styles.statusRow}>
          <StatusCard
            icon="🎧"
            title="AirPods"
            value={audioRoute.isAirPodsConnected ? '연결됨' : audioRoute.isBluetoothConnected ? 'BT 연결' : '미연결'}
            subtitle={audioRoute.isAirPodsConnected ? audioRoute.deviceName : audioRoute.isBluetoothConnected ? audioRoute.deviceName : '꺼짐'}
            color={audioRoute.isAirPodsConnected ? '#10B981' : audioRoute.isBluetoothConnected ? '#3B82F6' : '#6B7280'}
          />
          <StatusCard
            icon="🎙️"
            title="백그라운드 청취"
            value={isActive ? '활성화' : '비활성'}
            subtitle={isActive ? '모니터링 중' : '꺼짐'}
            color={isActive ? '#10B981' : '#6B7280'}
          />
          <StatusCard
            icon="🛡️"
            title="오늘 감지"
            value={`${stats.todayDetections}건`}
            subtitle={stats.todayDetections > 0 ? '위험 감지' : '안전'}
            color={stats.todayDetections > 0 ? '#F59E0B' : '#10B981'}
          />
        </View>

        {/* Recent Detection Logs */}
        <View style={styles.logsSection}>
          <View style={styles.logsSectionHeader}>
            <Text style={styles.logsSectionTitle}>최근 감지 로그</Text>
            {logs.length > 0 && (
              <TouchableOpacity onPress={() => navigateToTab('history')}>
                <Text style={styles.logsSeeAll}>전체 보기 ›</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentLogs.length > 0 ? (
            recentLogs.map(log => (
              <LogItem
                key={log.id}
                type={log.type}
                timestamp={log.timestamp}
                severity={log.severity}
              />
            ))
          ) : (
            <View style={styles.emptyLogs}>
              <Text style={styles.emptyLogsIcon}>🛡️</Text>
              <Text style={styles.emptyLogsText}>감지 기록이 없습니다</Text>
              <Text style={styles.emptyLogsSubtext}>
                보호 모드를 활성화하면 위험 감지가 시작됩니다
              </Text>
            </View>
          )}
        </View>

        {/* Safety Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipCardLeft}>
            <Text style={styles.tipCardIcon}>💡</Text>
            <View style={styles.tipCardContent}>
              <Text style={styles.tipCardTitle}>안전을 위한 팁</Text>
              <Text style={styles.tipCardText}>
                주변 교통 소리를 인지하고 대비하는 것만으로도 사고 위험을 크게 줄일 수 있습니다.
              </Text>
            </View>
          </View>
          <Text style={styles.tipCardArrow}>›</Text>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  safeArea: {
    flex: 1,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    zIndex: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 20,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minHeight: 44,
  },
  modeBadgeIcon: {
    fontSize: 14,
  },
  modeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Alert Banner
  alertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  alertBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertBannerIcon: {
    fontSize: 24,
  },
  alertBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  alertBannerSubtitle: {
    fontSize: 12,
    color: '#FCA5A5',
    marginTop: 2,
  },
  alertBannerTime: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
  },

  // Radar
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 260,
    marginVertical: 10,
  },
  radarGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  radarCenter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  radarStatus: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  radarSubStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  // Threat Detail Card
  threatCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  threatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  threatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  threatIconBig: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threatIconBigText: {
    fontSize: 26,
  },
  threatType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  threatTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  threatSeverityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  threatSeverityText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Threat status row
  threatStatusRow: {
    gap: 10,
    marginBottom: 18,
  },
  threatStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
  },
  threatStatusIcon: {
    fontSize: 18,
  },
  threatStatusLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  threatStatusValue: {
    fontSize: 12,
    color: '#6EE7B7',
    fontWeight: '600',
  },
  waveSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  waveBarSmall: {
    width: 2.5,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  vibrationDots: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 'auto',
  },
  vibrationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },

  // Direction Indicator
  directionCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  directionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  directionIcon: {
    fontSize: 16,
  },
  directionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  directionLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  directionBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  directionBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    width: 14,
    textAlign: 'center',
  },
  directionBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  directionBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: -1,
  },
  directionDot: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  directionZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  directionZoneLeft: {
    right: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  directionZoneRight: {
    left: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  directionNote: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },

  // Dismiss button
  threatActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dismissBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    minHeight: 56,
    justifyContent: 'center',
  },
  dismissBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  falsePositiveBtn: {
    flex: 1,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
    minHeight: 56,
    justifyContent: 'center',
  },
  falsePositiveBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  falsePositiveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  // Simulation
  simToggle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    marginBottom: 16,
  },
  simToggleText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '600',
  },
  simPanel: {
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  simHeaderIcon: {
    fontSize: 16,
  },
  simHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  simDevBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  simDevBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
  },
  simGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  simBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  simBtnIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  simBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Listening
  listeningIndicator: {
    alignItems: 'center',
    marginBottom: 24,
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  soundBar: {
    width: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  listeningText: {
    fontSize: 13,
    color: '#6EE7B7',
    fontWeight: '500',
  },

  // Status Cards
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statusCardIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statusCardTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusCardSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Logs Section
  logsSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logsSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logsSeeAll: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  logIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logIconText: {
    fontSize: 22,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyLogsIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyLogsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyLogsSubtext: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },

  // Tip Card
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tipCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  tipCardIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  tipCardContent: {
    flex: 1,
  },
  tipCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tipCardText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  tipCardArrow: {
    fontSize: 24,
    color: '#475569',
    fontWeight: '300',
  },
});

export default HomeScreen;
