/**
 * ScreenContainer - 모든 화면의 기본 컨테이너
 * 
 * SafeAreaView + 다크 배경 + 상태바를 통합 처리합니다.
 * Dynamic Island, Home Indicator 등 모든 기기에서 안전하게 렌더링됩니다.
 */

import React from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  noBottomPadding?: boolean; // 탭바가 있는 화면에서 사용
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  noBottomPadding = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      <SafeAreaView style={[styles.safeArea, noBottomPadding && styles.noBottom]}>
        {children}
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
  noBottom: {
    // 하단 탭바가 이미 Safe Area를 처리하므로 bottom padding 불필요
  },
});

export default ScreenContainer;
