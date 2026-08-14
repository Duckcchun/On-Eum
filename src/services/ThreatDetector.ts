import { onAudioBuffer, startListening, stopListening, AudioBufferEvent } from '../native/AudioBufferModule';
import { triggerAlert } from './AlertService';
import { classifyAudio, labelToThreatType, isThreatLabel, resetClassifier } from '../native/SoundClassifierModule';

const DEFAULT_RMS_THRESHOLD = 0.15;
const COOLDOWN_MS = 3000;
const CONSECUTIVE_DETECTIONS_REQUIRED = 3;
const DETECTION_WINDOW_MS = 500;

let unsubscribe: (() => void) | null = null;
let onThreatCallback: ((type: string) => void) | null = null;
let lastAlertTime = 0;
let currentThreshold = DEFAULT_RMS_THRESHOLD;
let lastDirection: number = 0; // -1 left, 0 center, 1 right

// 필터링을 위한 버퍼
let recentRMSValues: number[] = [];
let consecutiveDetections = 0;
let lastDetectionTime = 0;

interface DetectionSettings {
  rmsThreshold: number;
  hapticEnabled: boolean;
  audioEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

/**
 * RMS 강도에 따라 위험 유형을 추정합니다.
 * - 매우 높은 RMS (> 0.4): 차량 접근 (엔진 소리가 큼)
 * - 높은 RMS (> 0.25): 오토바이 접근
 * - 중간 RMS: 전동 킥보드 접근 (상대적으로 조용)
 * 
 * 향후 TensorFlow Lite ML 모델로 교체 예정
 */
const classifyThreat = (rms: number): string => {
  if (rms > 0.4) {
    return '차량 접근 감지';
  } else if (rms > 0.25) {
    return '오토바이 접근 감지';
  } else {
    return '전동 킥보드 접근 감지';
  }
};

const analyzeBuffer = (data: AudioBufferEvent) => {
  try {
    if (!data || typeof data.rms !== 'number') {
      console.warn('[ThreatDetector] Invalid audio buffer data');
      return;
    }

    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTime;
    const rms = data.rms;

    // Track direction
    if (data.direction !== undefined) {
      lastDirection = data.direction;
    }

    // 이동 평균 필터링
    recentRMSValues.push(rms);
    if (recentRMSValues.length > 5) {
      recentRMSValues.shift();
    }
    const averageRMS = recentRMSValues.reduce((sum, val) => sum + val, 0) / recentRMSValues.length;

    // ML 분류 시도 (비동기, 별도로 처리)
    if (data.samples && data.samples.length > 0 && averageRMS > currentThreshold * 0.5) {
      classifyWithML(data.samples, data.sampleRate, averageRMS);
    }

    // 연속 감지 확인
    if (averageRMS > currentThreshold) {
      const timeSinceLastDetection = now - lastDetectionTime;
      
      if (timeSinceLastDetection < DETECTION_WINDOW_MS) {
        consecutiveDetections++;
      } else {
        consecutiveDetections = 1;
      }
      
      lastDetectionTime = now;

      // 연속 감지 횟수가 임계값 이상이고 쿨다운이 지났을 때만 알림
      if (consecutiveDetections >= CONSECUTIVE_DETECTIONS_REQUIRED && timeSinceLastAlert > COOLDOWN_MS) {
        lastAlertTime = now;
        consecutiveDetections = 0;
        triggerAlert();
        if (onThreatCallback) {
          // ML 분류 결과가 있으면 사용, 없으면 RMS 기반 분류
          const threatType = lastMLLabel || classifyThreat(averageRMS);
          onThreatCallback(threatType);
          lastMLLabel = null; // 사용 후 리셋
        }
      }
    } else {
      consecutiveDetections = 0;
    }
  } catch (error) {
    console.error('[ThreatDetector] Error analyzing buffer:', error);
  }
};

// ML 분류 결과 저장
let lastMLLabel: string | null = null;

// ML 모델로 소리 분류 (비동기)
const classifyWithML = async (samples: number[], sampleRate: number, rms: number) => {
  try {
    const result = await classifyAudio(samples, sampleRate);
    if (result && result.isReady && result.confidence > 0.5) {
      if (isThreatLabel(result.label)) {
        const threatType = labelToThreatType(result.label);
        if (threatType) {
          lastMLLabel = threatType;
        }
      }
    }
  } catch (error) {
    // ML 실패 시 무시 (RMS fallback 사용)
  }
};

export const startDetection = (onThreat?: (type: string) => void, settings?: DetectionSettings) => {
  try {
    if (onThreat) {
      onThreatCallback = onThreat;
    }
    if (settings) {
      currentThreshold = settings.rmsThreshold;
    } else {
      currentThreshold = DEFAULT_RMS_THRESHOLD;
    }
    lastAlertTime = 0;
    recentRMSValues = [];
    consecutiveDetections = 0;
    lastDetectionTime = 0;
    startListening();
    unsubscribe = onAudioBuffer(analyzeBuffer);
  } catch (error) {
    console.error('[ThreatDetector] Error starting detection:', error);
    throw error;
  }
};

export const stopDetection = () => {
  try {
    stopListening();
    resetClassifier(); // ML 버퍼 초기화
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    onThreatCallback = null;
    lastAlertTime = 0;
    lastMLLabel = null;
    lastDirection = 0;
  } catch (error) {
    console.error('[ThreatDetector] Error stopping detection:', error);
  }
};

export const getLastDirection = (): number => lastDirection;

export default {
  startDetection,
  stopDetection,
  getLastDirection,
};
