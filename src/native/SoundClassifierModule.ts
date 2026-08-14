import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SoundClassifier } = NativeModules;

const isIOS = Platform.OS === 'ios';
const classifierEmitter = isIOS && SoundClassifier
  ? new NativeEventEmitter(SoundClassifier)
  : null;

export interface ClassificationResult {
  label: string;          // 'kickboard' | 'motorcycle' | 'vehicle' | 'horn' | 'ambient' | 'speech'
  confidence: number;     // 0.0 ~ 1.0
  isReady: boolean;
  rms?: number;
  centroid?: number;
  method?: 'tflite' | 'heuristic';
  allScores?: Record<string, number>;
}

export interface ModelStatus {
  isModelLoaded: boolean;
  labelCount: number;
  labels: string[];
  inputSize: number;
}

/**
 * Check if the ML model is loaded and ready
 */
export const isModelReady = async (): Promise<ModelStatus | null> => {
  try {
    if (!isIOS || !SoundClassifier) {
      return null;
    }
    return await SoundClassifier.isReady();
  } catch (error) {
    console.error('[SoundClassifier] Error checking model status:', error);
    return null;
  }
};

/**
 * Classify audio samples
 * @param samples - Array of float audio samples
 * @param sampleRate - Sample rate in Hz
 */
export const classifyAudio = async (
  samples: number[],
  sampleRate: number
): Promise<ClassificationResult | null> => {
  try {
    if (!isIOS || !SoundClassifier) {
      return null;
    }
    return await SoundClassifier.classifyAudio(samples, sampleRate);
  } catch (error) {
    console.error('[SoundClassifier] Error classifying audio:', error);
    return null;
  }
};

/**
 * Reset the internal sample buffer (call when detection stops)
 */
export const resetClassifier = () => {
  try {
    if (!isIOS || !SoundClassifier) return;
    SoundClassifier.resetBuffer();
  } catch (error) {
    console.error('[SoundClassifier] Error resetting buffer:', error);
  }
};

/**
 * Listen for real-time classification results
 */
export const onClassificationResult = (
  callback: (result: ClassificationResult) => void
): (() => void) => {
  try {
    if (!classifierEmitter) {
      return () => {};
    }
    const subscription = classifierEmitter.addListener('onClassificationResult', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[SoundClassifier] Error setting up listener:', error);
    return () => {};
  }
};

/**
 * Map classification label to Korean threat type string
 */
export const labelToThreatType = (label: string): string | null => {
  const mapping: Record<string, string> = {
    kickboard: '전동 킥보드 접근 감지',
    motorcycle: '오토바이 접근 감지',
    vehicle: '차량 접근 감지',
    horn: '경적 소리 감지',
  };
  return mapping[label] || null;
};

/**
 * Check if a label represents a threat (vs ambient/speech)
 */
export const isThreatLabel = (label: string): boolean => {
  return ['kickboard', 'motorcycle', 'vehicle', 'horn'].includes(label);
};

export default {
  isModelReady,
  classifyAudio,
  resetClassifier,
  onClassificationResult,
  labelToThreatType,
  isThreatLabel,
};
