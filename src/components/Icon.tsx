/**
 * Icon - SF Symbols 스타일 커스텀 아이콘 시스템
 * 
 * 이모지 대신 깔끔한 텍스트 기반 아이콘을 제공합니다.
 * react-native-svg 없이 순수 View + Text로 구현합니다.
 * 
 * 사용법:
 * <Icon name="shield" size={24} color="#10B981" />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export type IconName =
  | 'home' | 'history' | 'stats' | 'settings' | 'map'
  | 'shield' | 'shield-off' | 'microphone' | 'headphones'
  | 'alert' | 'check' | 'close' | 'chevron-right'
  | 'scooter' | 'motorcycle' | 'car' | 'horn'
  | 'volume' | 'vibration' | 'bluetooth' | 'wave'
  | 'location' | 'clock' | 'chart' | 'gear'
  | 'export' | 'trash' | 'info' | 'refresh'
  | 'compass' | 'battery' | 'lock' | 'play' | 'pause';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// ─── Icon Glyph Mapping ───
// Using Unicode symbols that render well across all iOS devices
const ICON_GLYPHS: Record<IconName, string> = {
  // Navigation
  home: '⌂',
  history: '◷',
  stats: '◑',
  settings: '⚙',
  map: '◎',

  // Core
  shield: '◆',
  'shield-off': '◇',
  microphone: '⏺',
  headphones: '⏏',

  // Actions
  alert: '▲',
  check: '✓',
  close: '✕',
  'chevron-right': '›',

  // Threats
  scooter: '⚡',
  motorcycle: '⊛',
  car: '■',
  horn: '◈',

  // Settings
  volume: '♪',
  vibration: '∿',
  bluetooth: '⊹',
  wave: '≋',

  // Utility
  location: '◉',
  clock: '◷',
  chart: '▤',
  gear: '⚙',
  export: '⇧',
  trash: '⊘',
  info: 'ⓘ',
  refresh: '↻',
  compass: '◎',
  battery: '▮',
  lock: '⊡',
  play: '▶',
  pause: '⏸',
};

const Icon: React.FC<IconProps> = ({ name, size = 20, color = '#FFFFFF', style }) => {
  const glyph = ICON_GLYPHS[name] || '●';

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text
        style={[
          styles.glyph,
          {
            fontSize: size * 0.75,
            lineHeight: size,
            color,
          },
        ]}
        allowFontScaling={false}
      >
        {glyph}
      </Text>
    </View>
  );
};

// ─── Circular Icon (with background) ───
interface CircularIconProps extends IconProps {
  backgroundColor?: string;
  borderColor?: string;
}

export const CircularIcon: React.FC<CircularIconProps> = ({
  name,
  size = 40,
  color = '#FFFFFF',
  backgroundColor = 'rgba(255,255,255,0.08)',
  borderColor,
  style,
}) => {
  return (
    <View
      style={[
        styles.circularContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderWidth: borderColor ? 1.5 : 0,
          borderColor: borderColor || 'transparent',
        },
        style,
      ]}
    >
      <Icon name={name} size={size * 0.5} color={color} />
    </View>
  );
};

// ─── Badge Icon (with notification dot) ───
interface BadgeIconProps extends IconProps {
  badgeCount?: number;
  badgeColor?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  name,
  size = 24,
  color = '#FFFFFF',
  badgeCount,
  badgeColor = '#EF4444',
}) => {
  return (
    <View style={styles.badgeContainer}>
      <Icon name={name} size={size} color={color} />
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '400',
    textAlign: 'center',
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default Icon;
