import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp } from './src/context/AppContext';
import { HomeScreenSkeleton } from './src/components/Skeleton';
import TabBar, { TabName } from './src/navigation/TabBar';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import Onboarding from './src/screens/Onboarding';
import PermissionScreen from './src/screens/PermissionScreen';

// ─── Splash Screen ───
const SplashScreen: React.FC = () => {
  const radarAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={splashStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* Radar Waves */}
      <View style={splashStyles.radarContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              splashStyles.radarWave,
              {
                transform: [
                  {
                    scale: radarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2 + index * 0.5],
                    }),
                  },
                ],
                opacity: radarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6 - index * 0.15, 0],
                }),
              },
            ]}
          />
        ))}

        {/* Center Icon */}
        <Animated.View
          style={[splashStyles.iconContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <Text style={splashStyles.icon}>🎧</Text>
        </Animated.View>
      </View>

      {/* Text */}
      <Animated.View style={[splashStyles.textContainer, { opacity: fadeAnim }]}>
        <Text style={splashStyles.title}>온음</Text>
        <Text style={splashStyles.subtitle}>AI 위험음 감지 시스템</Text>
      </Animated.View>
    </View>
  );
};

// ─── Main App Navigator ───
const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('home');

  return (
    <View style={mainStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      <PermissionGate>
        <View style={mainStyles.screen}>
          <MainScreen activeTab={activeTab} setActiveTab={setActiveTab} />
        </View>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </PermissionGate>
    </View>
  );
};

// Permission gate - shows permission screen if mic not granted
const PermissionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { micPermission, requestMicPermission } = useApp();
  const [skipped, setSkipped] = useState(false);

  // 시뮬레이터에서는 네이티브 모듈이 없어 권한 체크 불가 → 자동 스킵
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (micPermission === 'undetermined') {
        setSkipped(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [micPermission]);

  if (skipped || micPermission === 'granted') {
    return <>{children}</>;
  }

  return (
    <PermissionScreen
      status={micPermission === 'denied' ? 'denied' : 'undetermined'}
      onRequestPermission={async () => {
        const result = await requestMicPermission();
        if (result === 'undetermined') {
          setSkipped(true);
        }
        return result;
      }}
      onSkip={() => setSkipped(true)}
    />
  );
};

// Separate component to access AppContext (inside AppProvider)
const MainScreen: React.FC<{ activeTab: TabName; setActiveTab: (tab: TabName) => void }> = ({ activeTab, setActiveTab }) => {
  const { setTabNavigator, isLoaded } = useApp();

  useEffect(() => {
    setTabNavigator((tab: string) => setActiveTab(tab as TabName));
  }, [setTabNavigator, setActiveTab]);

  if (!isLoaded) {
    return <HomeScreenSkeleton />;
  }

  return (
    <SafeAreaView style={mainStyles.screen}>
      {(() => {
        switch (activeTab) {
          case 'home':
            return <HomeScreen />;
          case 'history':
            return <HistoryScreen />;
          case 'stats':
            return <StatsScreen />;
          case 'settings':
            return <SettingsScreen />;
          default:
            return <HomeScreen />;
        }
      })()}
    </SafeAreaView>
  );
};

// ─── Root App ───
const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(splashTimer);
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboardingCompleted');
      setShowOnboarding(!completed);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0B1120' }} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};

// ─── Styles ───
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  radarWave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6EE7B7',
    fontWeight: '600',
    letterSpacing: 1,
  },
});

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  screen: {
    flex: 1,
  },
});

export default App;
