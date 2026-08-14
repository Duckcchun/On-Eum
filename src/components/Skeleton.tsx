/**
 * Skeleton - 로딩 상태에서 보여줄 스켈레톤 UI 컴포넌트
 * 
 * 콘텐츠가 로드되기 전에 레이아웃 형태를 미리 보여주어
 * 사용자가 화면 구조를 예측할 수 있게 합니다.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ─── Base Skeleton Block ───
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBlock: React.FC<SkeletonProps> = ({
  width: w = '100%',
  height: h = 16,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width: w as any,
          height: h,
          borderRadius,
          opacity: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.6],
          }),
        },
        style,
      ]}
    />
  );
};

// ─── Home Screen Skeleton ───
export const HomeScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <SkeletonBlock width={80} height={32} borderRadius={6} />
          <SkeletonBlock width={200} height={14} style={{ marginTop: 8 }} />
        </View>
        <SkeletonBlock width={90} height={40} borderRadius={20} />
      </View>

      {/* Radar circle */}
      <View style={styles.radarSkeleton}>
        <SkeletonBlock width={160} height={160} borderRadius={80} />
      </View>

      {/* Status cards */}
      <View style={styles.cardsRow}>
        <SkeletonBlock width="31%" height={100} borderRadius={16} />
        <SkeletonBlock width="31%" height={100} borderRadius={16} />
        <SkeletonBlock width="31%" height={100} borderRadius={16} />
      </View>

      {/* Log section */}
      <SkeletonBlock width="100%" height={180} borderRadius={20} style={{ marginTop: 20 }} />
    </View>
  );
};

// ─── Generic List Skeleton ───
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <View style={styles.container}>
      {/* Title */}
      <SkeletonBlock width={120} height={28} borderRadius={6} />
      <SkeletonBlock width={200} height={14} style={{ marginTop: 8, marginBottom: 24 }} />

      {/* Summary cards */}
      <View style={styles.cardsRow}>
        <SkeletonBlock width="31%" height={80} borderRadius={14} />
        <SkeletonBlock width="31%" height={80} borderRadius={14} />
        <SkeletonBlock width="31%" height={80} borderRadius={14} />
      </View>

      {/* List items */}
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <SkeletonBlock width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <SkeletonBlock width="70%" height={16} borderRadius={4} />
            <SkeletonBlock width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  block: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  radarSkeleton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginVertical: 10,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
});

export default SkeletonBlock;
