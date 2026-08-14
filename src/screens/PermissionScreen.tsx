import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';

interface PermissionScreenProps {
  status: 'undetermined' | 'denied';
  onRequestPermission: () => Promise<string>;
  onSkip?: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({
  status,
  onRequestPermission,
  onSkip,
}) => {
  const isDenied = status === 'denied';

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    }
  };

  const handleAllow = async () => {
    if (isDenied) {
      handleOpenSettings();
    } else {
      await onRequestPermission();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Text style={styles.icon}>🎙️</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        {isDenied ? '마이크 접근이\n차단되었어요' : '마이크 접근이\n필요합니다'}
      </Text>

      {/* Description */}
      <Text style={styles.description}>
        {isDenied
          ? '온음이 위험 소리를 감지하려면 마이크 접근 권한이 필요합니다.\n설정에서 마이크 권한을 허용해 주세요.'
          : '온음은 주변 소리를 실시간으로 분석하여\n킥보드, 오토바이, 차량의 접근을 감지합니다.'}
      </Text>

      {/* Feature cards */}
      <View style={styles.featureList}>
        <FeatureItem
          icon="🛡️"
          title="보행 안전"
          description="에어팟 사용 중에도 위험을 감지합니다"
        />
        <FeatureItem
          icon="🔒"
          title="프라이버시 보호"
          description="음성 녹음을 저장하지 않습니다"
        />
        <FeatureItem
          icon="🔋"
          title="배터리 최적화"
          description="적응형 감지로 배터리 소모를 최소화합니다"
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.allowButton}
        onPress={handleAllow}
        activeOpacity={0.8}
      >
        <Text style={styles.allowButtonText}>
          {isDenied ? '설정으로 이동' : '마이크 접근 허용'}
        </Text>
      </TouchableOpacity>

      {/* Skip option (only for undetermined) */}
      {!isDenied && onSkip && (
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>나중에 하기</Text>
        </TouchableOpacity>
      )}

      {/* Privacy note */}
      <Text style={styles.privacyNote}>
        🔐 온음은 소리를 분석만 하며, 녹음 데이터를 서버에 전송하지 않습니다.
      </Text>
    </View>
  );
};

// ─── Feature Item ───
const FeatureItem: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    paddingHorizontal: 28,
    paddingTop: 80,
    alignItems: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    top: -50,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    bottom: 100,
    left: -60,
  },

  // Icon
  iconContainer: {
    marginBottom: 32,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
    letterSpacing: -0.5,
  },

  // Description
  description: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },

  // Features
  featureList: {
    width: '100%',
    gap: 14,
    marginBottom: 36,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748B',
  },

  // Buttons
  allowButton: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  allowButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },

  // Privacy
  privacyNote: {
    position: 'absolute',
    bottom: 50,
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});

export default PermissionScreen;
