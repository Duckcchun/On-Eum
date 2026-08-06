import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from './src/screens/Dashboard';
import Onboarding from './src/screens/Onboarding';

const SplashScreen = () => {
  const radarAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 레이더 파동 애니메이션
    Animated.timing(radarAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 텍스트 페이드인
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* 레이더 파동 */}
      <View style={styles.radarContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.radarWave,
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
                  outputRange: [0.8 - index * 0.2, 0],
                }),
              },
            ]}
          />
        ))}
        
        {/* 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎧</Text>
        </View>
      </View>

      {/* 텍스트 */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>온음</Text>
        <Text style={styles.subtitle}>AI Noise Detection</Text>
        <Text style={styles.subtitle}>& Safety Alert</Text>
      </Animated.View>
    </View>
  );
};

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [resetOnboarding, setResetOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
    
    // 스플래시 스크린 2초 후 숨기기
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, [resetOnboarding]);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      setShowOnboarding(!onboardingCompleted);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleResetOnboarding = () => {
    setResetOnboarding(prev => !prev);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {showOnboarding ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard onResetOnboarding={handleResetOnboarding} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default App;
