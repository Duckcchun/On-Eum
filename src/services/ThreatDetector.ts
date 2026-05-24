import { onAudioBuffer, startListening, stopListening, AudioBufferEvent } from '../native/AudioBufferModule';
import { triggerAlert } from './AlertService';

const RMS_THRESHOLD = 0.15;
let unsubscribe: (() => void) | null = null;
let onThreatCallback: ((type: string) => void) | null = null;

const analyzeBuffer = (data: AudioBufferEvent) => {
  if (data.rms > RMS_THRESHOLD) {
    triggerAlert();
    if (onThreatCallback) {
      onThreatCallback('위험음 감지 (RMS: ' + data.rms.toFixed(3) + ')');
    }
  }
};

export const startDetection = (onThreat?: (type: string) => void) => {
  if (onThreat) {
    onThreatCallback = onThreat;
  }
  startListening();
  unsubscribe = onAudioBuffer(analyzeBuffer);
};

export const stopDetection = () => {
  stopListening();
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  onThreatCallback = null;
};

export default {
  startDetection,
  stopDetection,
};
