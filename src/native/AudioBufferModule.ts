import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AudioBufferManager } = NativeModules;

const isIOS = Platform.OS === 'ios';
const audioBufferEmitter = isIOS && AudioBufferManager 
  ? new NativeEventEmitter(AudioBufferManager) 
  : null;

export interface AudioBufferEvent {
  rms: number;
  leftRMS?: number;
  rightRMS?: number;
  direction?: number;      // -1.0 (left) ~ 0.0 (center) ~ 1.0 (right)
  channelCount?: number;
  sampleRate: number;
  frameLength: number;
  samples: number[];
  isAdaptive?: boolean;
  bufferDuration?: number;
}

export interface AudioInterruptionEvent {
  type: 'began' | 'ended';
}

export interface BackgroundStateEvent {
  isBackground: boolean;
}

export const startListening = () => {
  try {
    if (!isIOS || !AudioBufferManager) {
      console.warn('[AudioBufferModule] AudioBufferManager not available on this platform');
      return;
    }
    AudioBufferManager.startListening();
  } catch (error) {
    console.error('[AudioBufferModule] Error starting listening:', error);
    throw error;
  }
};

export const stopListening = () => {
  try {
    if (!isIOS || !AudioBufferManager) {
      console.warn('[AudioBufferModule] AudioBufferManager not available on this platform');
      return;
    }
    AudioBufferManager.stopListening();
  } catch (error) {
    console.error('[AudioBufferModule] Error stopping listening:', error);
  }
};

/**
 * Enable/disable adaptive mode (battery optimization)
 * - Adaptive ON: longer buffer intervals when quiet, shorter when sound detected
 * - Adaptive OFF: always use shortest interval (highest accuracy)
 */
export const setAdaptiveMode = (enabled: boolean) => {
  try {
    if (!isIOS || !AudioBufferManager) {
      return;
    }
    AudioBufferManager.setAdaptiveMode(enabled);
  } catch (error) {
    console.error('[AudioBufferModule] Error setting adaptive mode:', error);
  }
};

export const onAudioBuffer = (callback: (data: AudioBufferEvent) => void) => {
  try {
    if (!audioBufferEmitter) {
      console.warn('[AudioBufferModule] AudioBuffer emitter not available');
      return () => {};
    }
    const subscription = audioBufferEmitter.addListener('onAudioBuffer', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[AudioBufferModule] Error setting up audio buffer listener:', error);
    return () => {};
  }
};

/**
 * Listen for audio interruptions (phone calls, Siri, etc.)
 */
export const onAudioInterruption = (callback: (event: AudioInterruptionEvent) => void) => {
  try {
    if (!audioBufferEmitter) {
      return () => {};
    }
    const subscription = audioBufferEmitter.addListener('onAudioInterruption', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[AudioBufferModule] Error setting up interruption listener:', error);
    return () => {};
  }
};

/**
 * Listen for background/foreground state changes
 */
export const onBackgroundStateChange = (callback: (event: BackgroundStateEvent) => void) => {
  try {
    if (!audioBufferEmitter) {
      return () => {};
    }
    const subscription = audioBufferEmitter.addListener('onBackgroundStateChange', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[AudioBufferModule] Error setting up background state listener:', error);
    return () => {};
  }
};

export default {
  startListening,
  stopListening,
  setAdaptiveMode,
  onAudioBuffer,
  onAudioInterruption,
  onBackgroundStateChange,
};
