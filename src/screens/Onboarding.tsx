import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
}

const slides: OnboardingSlide[] = [
  {
    title: '온음에 오신 것을 환영합니다',
    description: '에어팟 사용자를 위한 스마트 위험음 감지 시스템입니다. 킥보드와 차량의 위험한 소리를 실시간으로 감지하여 안전하게 보행할 수 있도록 도와드립니다.',
    icon: '🎧',
  },
  {
    title: '실시간 위험 감지',
    description: '마이크를 통해 주변 소음을 분석하고, 위험한 소리가 감지되면 즉시 진동과 경고음으로 알려줍니다. RMS 기반의 정교한 감지 알고리즘을 사용합니다.',
    icon: '🔔',
  },
  {
    title: '개인화된 설정',
    description: '감지 민감도, 알림 방식 등을 자유롭게 설정할 수 있습니다. 본인의 환경에 맞춰 최적의 안전 설정을 구성하세요.',
    icon: '⚙️',
  },
  {
    title: '안전한 보행 시작하기',
    description: '이제 온음과 함께 안전하게 보행하세요. 위험음 감지 기능을 활성화하고 주변 환경을 안전하게 모니터링하세요.',
    icon: '🚀',
  },
];

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollViewRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      onComplete();
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{slide.icon}</Text>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex < slides.length - 1 ? (
            <>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>건너뛰기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>다음</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={handleComplete} style={styles.completeButton}>
              <Text style={styles.completeButtonText}>시작하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#10B981',
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default Onboarding;
