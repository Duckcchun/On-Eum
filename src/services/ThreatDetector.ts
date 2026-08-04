import { onAudioBuffer, startListening, stopListening, AudioBufferEvent } from '../native/AudioBufferModule';
import { triggerAlert } from './AlertService';

const DEFAULT_RMS_THRESHOLD = 0.15;
const COOLDOWN_MS = 3000;
const CONSECUTIVE_DETECTIONS_REQUIRED = 3;
const DETECTION_WINDOW_MS = 500;

let unsubscribe: (() => void) | null = null;
let onThreatCallback: ((type: string) => void) | null = null;
let lastAlertTime = 0;
let currentThreshold = DEFAULT_RMS_THRESHOLD;

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

const analyzeBuffer = (data: AudioBufferEvent) => {
  try {
    if (!data || typeof data.rms !== 'number') {
      console.warn('[ThreatDetector] Invalid audio buffer data');
      return;
    }

    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTime;
    const rms = data.rms;

    // 이동 평균 필터링
    recentRMSValues.push(rms);
    if (recentRMSValues.length > 5) {
      recentRMSValues.shift();
    }
    const averageRMS = recentRMSValues.reduce((sum, val) => sum + val, 0) / recentRMSValues.length;

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
          onThreatCallback(`위험음 감지 (RMS: ${averageRMS.toFixed(3)}, 연속: ${CONSECUTIVE_DETECTIONS_REQUIRED}회)`);
        }
      }
    } else {
      // 임계값 미만이면 연속 감지 카운트 리셋
      consecutiveDetections = 0;
    }
  } catch (error) {
    console.error('[ThreatDetector] Error analyzing buffer:', error);
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
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    onThreatCallback = null;
    lastAlertTime = 0;
  } catch (error) {
    console.error('[ThreatDetector] Error stopping detection:', error);
  }
};

export default {
  startDetection,
  stopDetection,
};
