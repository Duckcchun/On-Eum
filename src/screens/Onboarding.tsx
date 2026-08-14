import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
  accent: string;
}

const slides: OnboardingSlide[] = [
  {
    title: '당신의 안전을\n온음이 지켜드릴게요',
    description:
      '에어팟 노이즈 캔슬링 사용 중에도\n킥보드, 차량의 위험 소리를 실시간으로 감지합니다.',
    icon: '🎧',
    accent: '#10B981',
  },
  {
    title: '실시간 AI\n소리 분석',
    description:
      '마이크로 주변 소리를 분석하고,\n위험이 감지되면 0.2초 내에 알려드립니다.',
    icon: '🧠',
    accent: '#3B82F6',
  },
  {
    title: '즉각적인\n위험 알림',
    description:
      '햅틱 진동과 경고음으로\n위험을 놓치지 않도록 도와줍니다.',
    icon: '🔔',
    accent: '#F59E0B',
  },
  {
    title: '지금 바로\n시작하세요',
    description:
      '보호 모드를 켜면\n안전한 보행이 시작됩니다.',
    icon: '🛡️',
    accent: '#10B981',
  },
];

const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => handleComplete();

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
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* Skip button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
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
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${slide.accent}15`, borderColor: `${slide.accent}30` },
              ]}
            >
              <Text style={styles.icon}>{slide.icon}</Text>
            </View>

            {/* Text */}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {slides.map((slide, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && [
                  styles.dotActive,
                  { backgroundColor: slide.accent },
                ],
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: currentSlide.accent }]}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 42,
    letterSpacing: -0.5,
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
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 28,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

export default Onboarding;
