import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export type TabName = 'home' | 'history' | 'stats' | 'settings';

interface TabItem {
  key: TabName;
  label: string;
  icon: string;
  iconActive: string;
}

const tabs: TabItem[] = [
  { key: 'home', label: '홈', icon: '🏠', iconActive: '🏠' },
  { key: 'history', label: '기록', icon: '🕐', iconActive: '🕐' },
  { key: 'stats', label: '통계', icon: '📊', iconActive: '📊' },
  { key: 'settings', label: '설정', icon: '⚙️', iconActive: '⚙️' },
];

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = width / tabs.length;

  useEffect(() => {
    const index = tabs.findIndex(t => t.key === activeTab);
    Animated.spring(indicatorAnim, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {/* Active indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: tabWidth,
            transform: [{ translateX: indicatorAnim }],
          },
        ]}
      />

      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {isActive ? tab.iconActive : tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 28,
    paddingTop: 12,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: '#10B981',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  labelActive: {
    color: '#10B981',
    fontWeight: '700',
  },
});

export default TabBar;
