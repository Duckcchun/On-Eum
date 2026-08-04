import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from './src/screens/Dashboard';
import Onboarding from './src/screens/Onboarding';

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

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

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1">
      {showOnboarding ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard />
      )}
    </SafeAreaView>
  );
};

export default App;
