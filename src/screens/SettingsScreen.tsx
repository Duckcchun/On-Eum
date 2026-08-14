import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp, AppSettings } from '../context/AppContext';

// ─── Setting Row Component ───
const SettingRow: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}> = ({ icon, title, subtitle, right, onPress }) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={!onPress && !right}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingRowLeft}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingTexts}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {right}
  </TouchableOpacity>
);

// ─── Main SettingsScreen ───
const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, isActive } = useApp();

  const handleSensitivityChange = (sensitivity: 'low' | 'medium' | 'high') => {
    const thresholdMap = { low: 0.25, medium: 0.15, high: 0.08 };
    updateSettings({
      ...settings,
      sensitivity,
      rmsThreshold: thresholdMap[sensitivity],
    });
  };

  const handleHapticToggle = (value: boolean) => {
    updateSettings({ ...settings, hapticEnabled: value });
  };

  const handleAudioToggle = (value: boolean) => {
    updateSettings({ ...settings, audioEnabled: value });
  };

  const handleResetOnboarding = async () => {
    Alert.alert('온보딩 초기화', '온보딩 화면을 다시 볼까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '초기화',
        onPress: async () => {
          await AsyncStorage.removeItem('onboardingCompleted');
          Alert.alert('완료', '앱을 재시작하면 온보딩이 다시 표시됩니다.');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>설정</Text>
        <Text style={styles.subtitle}>감지 민감도와 알림 방식을 설정하세요</Text>

        {/* Detection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusIcon}>{isActive ? '🟢' : '⚪'}</Text>
            <View>
              <Text style={styles.statusTitle}>보호 모드</Text>
              <Text style={styles.statusSubtitle}>
                {isActive ? '현재 활성화되어 있습니다' : '비활성 상태입니다'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sensitivity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>감지 민감도</Text>
          <Text style={styles.sectionSubtitle}>
            환경에 맞게 감지 민감도를 조절하세요
          </Text>

          <View style={styles.sensitivityContainer}>
            {([
              { key: 'high' as const, label: '높음', desc: '조용한 환경', value: '0.08' },
              { key: 'medium' as const, label: '보통', desc: '일반 도로', value: '0.15' },
              { key: 'low' as const, label: '낮음', desc: '시끄러운 환경', value: '0.25' },
            ]).map(item => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.sensitivityOption,
                  settings.sensitivity === item.key && styles.sensitivityActive,
                ]}
                onPress={() => handleSensitivityChange(item.key)}
              >
                <View style={styles.sensitivityHeader}>
                  <Text
                    style={[
                      styles.sensitivityLabel,
                      settings.sensitivity === item.key && styles.sensitivityLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {settings.sensitivity === item.key && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </View>
                <Text style={styles.sensitivityDesc}>{item.desc}</Text>
                <Text style={styles.sensitivityValue}>임계값: {item.value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom threshold display */}
          <View style={styles.thresholdDisplay}>
            <Text style={styles.thresholdLabel}>현재 임계값</Text>
            <Text style={styles.thresholdValue}>{settings.rmsThreshold.toFixed(2)}</Text>
          </View>
        </View>

        {/* Alert Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 방식</Text>

          <SettingRow
            icon="📳"
            title="햅틱 진동"
            subtitle="위험 감지 시 진동으로 알림"
            right={
              <Switch
                value={settings.hapticEnabled}
                onValueChange={handleHapticToggle}
                trackColor={{ false: '#374151', true: 'rgba(16, 185, 129, 0.4)' }}
                thumbColor={settings.hapticEnabled ? '#10B981' : '#9CA3AF'}
              />
            }
          />

          <SettingRow
            icon="🔊"
            title="경고음 재생"
            subtitle="에어팟으로 경고음 전송"
            right={
              <Switch
                value={settings.audioEnabled}
                onValueChange={handleAudioToggle}
                trackColor={{ false: '#374151', true: 'rgba(16, 185, 129, 0.4)' }}
                thumbColor={settings.audioEnabled ? '#10B981' : '#9CA3AF'}
              />
            }
          />
        </View>

        {/* Volume & Pattern Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 세부 설정</Text>
          <Text style={styles.sectionSubtitle}>
            경고음 볼륨과 진동 패턴을 조절하세요
          </Text>

          {/* Volume slider */}
          <View style={styles.volumeSection}>
            <Text style={styles.volumeLabel}>🔊 경고음 볼륨</Text>
            <View style={styles.volumeOptions}>
              {[
                { value: 0.3, label: '작게' },
                { value: 0.6, label: '보통' },
                { value: 0.8, label: '크게' },
                { value: 1.0, label: '최대' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.volumeOption,
                    settings.alertVolume === opt.value && styles.volumeOptionActive,
                  ]}
                  onPress={() => updateSettings({ ...settings, alertVolume: opt.value })}
                >
                  <Text style={[
                    styles.volumeOptionText,
                    settings.alertVolume === opt.value && styles.volumeOptionTextActive,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Haptic pattern */}
          <View style={styles.volumeSection}>
            <Text style={styles.volumeLabel}>📳 진동 패턴</Text>
            <View style={styles.volumeOptions}>
              {([
                { value: 'soft' as const, label: '약하게', desc: '1회 진동' },
                { value: 'medium' as const, label: '보통', desc: '2회 진동' },
                { value: 'strong' as const, label: '강하게', desc: '4회 진동' },
              ]).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.volumeOption,
                    settings.hapticPattern === opt.value && styles.volumeOptionActive,
                  ]}
                  onPress={() => updateSettings({ ...settings, hapticPattern: opt.value })}
                >
                  <Text style={[
                    styles.volumeOptionText,
                    settings.hapticPattern === opt.value && styles.volumeOptionTextActive,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일반</Text>

          <SettingRow
            icon="🔄"
            title="온보딩 다시 보기"
            subtitle="앱 소개 화면을 다시 봅니다"
            onPress={handleResetOnboarding}
            right={<Text style={styles.arrow}>›</Text>}
          />

          <SettingRow
            icon="ℹ️"
            title="앱 버전"
            subtitle="온음 v1.0.0"
            right={<Text style={styles.versionText}>1.0.0</Text>}
          />
        </View>

        {/* About */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutIcon}>🎧</Text>
          <Text style={styles.aboutTitle}>온음 (On-Eum)</Text>
          <Text style={styles.aboutText}>
            에어팟 사용자를 위한{'\n'}AI 위험음 감지 시스템
          </Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
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
    marginBottom: 24,
  },

  // Status Card
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },

  // Sensitivity
  sensitivityContainer: {
    gap: 10,
    marginBottom: 16,
  },
  sensitivityOption: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sensitivityActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  sensitivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sensitivityLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sensitivityLabelActive: {
    color: '#10B981',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  sensitivityDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  sensitivityValue: {
    fontSize: 12,
    color: '#475569',
  },
  thresholdDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  thresholdValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981',
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingTexts: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: '#475569',
    fontWeight: '300',
  },
  versionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // About
  aboutCard: {
    alignItems: 'center',
    paddingVertical: 30,
    opacity: 0.6,
  },
  aboutIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aboutText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 12,
    color: '#475569',
  },

  // Volume/Pattern
  volumeSection: {
    marginBottom: 18,
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 10,
  },
  volumeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  volumeOptionActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  volumeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  volumeOptionTextActive: {
    color: '#10B981',
  },
});

export default SettingsScreen;
