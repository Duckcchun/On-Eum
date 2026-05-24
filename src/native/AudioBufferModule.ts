import { NativeModules, NativeEventEmitter } from 'react-native';

const { AudioBufferManager } = NativeModules;
const audioBufferEmitter = new NativeEventEmitter(AudioBufferManager);

export interface AudioBufferEvent {
  rms: number;
  sampleRate: number;
  frameLength: number;
  samples: number[];
}

export const startListening = () => {
  AudioBufferManager.startListening();
};

export const stopListening = () => {
  AudioBufferManager.stopListening();
};

export const onAudioBuffer = (callback: (data: AudioBufferEvent) => void) => {
  const subscription = audioBufferEmitter.addListener('onAudioBuffer', callback);
  return () => subscription.remove();
};

export default {
  startListening,
  stopListening,
  onAudioBuffer,
};
