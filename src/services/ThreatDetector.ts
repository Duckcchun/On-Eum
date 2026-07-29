import { onAudioBuffer, startListening, stopListening, AudioBufferEvent } from '../native/AudioBufferModule';
import { triggerAlert } from './AlertService';

const RMS_THRESHOLD = 0.15;
const COOLDOWN_MS = 3000;

let unsubscribe: (() => void) | null = null;
let onThreatCallback: ((type: string) => void) | null = null;
let lastAlertTime = 0;

const analyzeBuffer = (data: AudioBufferEvent) => {
  try {
    if (!data || typeof data.rms !== 'number') {
      console.warn('[ThreatDetector] Invalid audio buffer data');
      return;
    }

    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTime;

    if (data.rms > RMS_THRESHOLD && timeSinceLastAlert > COOLDOWN_MS) {
      lastAlertTime = now;
      triggerAlert();
      if (onThreatCallback) {
        onThreatCallback(`위험음 감지 (RMS: ${data.rms.toFixed(3)})`);
      }
    }
  } catch (error) {
    console.error('[ThreatDetector] Error analyzing buffer:', error);
  }
};

export const startDetection = (onThreat?: (type: string) => void) => {
  try {
    if (onThreat) {
      onThreatCallback = onThreat;
    }
    lastAlertTime = 0;
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
