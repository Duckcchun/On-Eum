import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AudioBufferManager } = NativeModules;

const isIOS = Platform.OS === 'ios';
const audioBufferEmitter = isIOS && AudioBufferManager 
  ? new NativeEventEmitter(AudioBufferManager) 
  : null;

export interface AudioBufferEvent {
  rms: number;
  sampleRate: number;
  frameLength: number;
  samples: number[];
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

export default {
  startListening,
  stopListening,
  onAudioBuffer,
};
