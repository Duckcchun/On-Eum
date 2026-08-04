import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  rmsThreshold: number;
  hapticEnabled: boolean;
  audioEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

const Settings = ({ onBack, onSettingsChange }: { onBack: () => void; onSettingsChange: (settings: Settings) => void }) => {
  const [settings, setSettings] = useState<Settings>({
    rmsThreshold: 0.15,
    hapticEnabled: true,
    audioEnabled: true,
    sensitivity: 'medium',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('onEumSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        onSettingsChange(parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem('onEumSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      onSettingsChange(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleThresholdChange = (value: number) => {
    saveSettings({ ...settings, rmsThreshold: value });
  };

  const handleHapticToggle = (value: boolean) => {
    saveSettings({ ...settings, hapticEnabled: value });
  };

  const handleAudioToggle = (value: boolean) => {
    saveSettings({ ...settings, audioEnabled: value });
  };

  const handleSensitivityChange = (sensitivity: 'low' | 'medium' | 'high') => {
    const thresholdMap = { low: 0.25, medium: 0.15, high: 0.08 };
    saveSettings({ 
      ...settings, 
      sensitivity, 
      rmsThreshold: thresholdMap[sensitivity] 
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 감지 임계값 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>감지 임계값</Text>
          <Text style={styles.sectionDescription}>
            소음 감지 민감도를 조절합니다. 값이 낮을수록 더 민감합니다.
          </Text>
          <View style={styles.thresholdContainer}>
            <Text style={styles.thresholdValue}>{settings.rmsThreshold.toFixed(2)}</Text>
            <View style={styles.thresholdSlider}>
              {[0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.thresholdDot,
                    settings.rmsThreshold === value && styles.thresholdDotActive,
                  ]}
                  onPress={() => handleThresholdChange(value)}
                >
                  <Text style={[
                    styles.thresholdDotText,
                    settings.rmsThreshold === value && styles.thresholdDotTextActive,
                  ]}>
                    {value.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 감지 민감도 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>감지 민감도</Text>
          <Text style={styles.sectionDescription}>
            빠른 설정으로 감지 민감도를 조절합니다.
          </Text>
          <View style={styles.sensitivityContainer}>
            {(['low', 'medium', 'high'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.sensitivityButton,
                  settings.sensitivity === level && styles.sensitivityButtonActive,
                ]}
                onPress={() => handleSensitivityChange(level)}
              >
                <Text style={[
                  styles.sensitivityButtonText,
                  settings.sensitivity === level && styles.sensitivityButtonTextActive,
                ]}>
                  {level === 'low' ? '낮음' : level === 'medium' ? '중간' : '높음'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 알림 방식 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 방식</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>햅틱 진동</Text>
              <Text style={styles.settingDescription}>위험 감지 시 진동 알림</Text>
            </View>
            <Switch
              value={settings.hapticEnabled}
              onValueChange={handleHapticToggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={settings.hapticEnabled ? '#10B981' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>오디오 알림</Text>
              <Text style={styles.settingDescription}>위험 감지 시 경고음 재생</Text>
            </View>
            <Switch
              value={settings.audioEnabled}
              onValueChange={handleAudioToggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={settings.audioEnabled ? '#10B981' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>앱 정보</Text>
          <Text style={styles.infoText}>온음 v1.0.0</Text>
          <Text style={styles.infoText}>에어팟 사용자를 위한 스마트 위험음 감지 시스템</Text>
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
    marginBottom: 30,
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
    fontWeight: '700',
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
  },
  thresholdContainer: {
    alignItems: 'center',
  },
  thresholdValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 20,
  },
  thresholdSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  thresholdDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thresholdDotActive: {
    backgroundColor: '#10B981',
  },
  thresholdDotText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  thresholdDotTextActive: {
    color: '#FFFFFF',
  },
  sensitivityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensitivityButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  sensitivityButtonActive: {
    backgroundColor: '#10B981',
  },
  sensitivityButtonText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sensitivityButtonTextActive: {
    color: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#94A3B8',
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
});

export default Settings;
