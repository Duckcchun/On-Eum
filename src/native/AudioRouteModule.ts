import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AudioRouteManager } = NativeModules;

const isIOS = Platform.OS === 'ios';
const routeEmitter = isIOS && AudioRouteManager
  ? new NativeEventEmitter(AudioRouteManager)
  : null;

export interface AudioRouteInfo {
  outputName: string;
  outputType: string;
  inputName: string;
  isBluetoothConnected: boolean;
  isAirPods: boolean;
  hasExternalMic: boolean;
  deviceModel: string;
}

export interface AudioRouteChangeEvent extends AudioRouteInfo {
  reason: 'connected' | 'disconnected' | 'categoryChange' | 'override' | 'configChange' | 'unknown';
}

/**
 * Get the current audio route information
 */
export const getCurrentRoute = async (): Promise<AudioRouteInfo | null> => {
  try {
    if (!isIOS || !AudioRouteManager) {
      console.warn('[AudioRouteModule] Not available on this platform');
      return null;
    }
    return await AudioRouteManager.getCurrentRoute();
  } catch (error) {
    console.error('[AudioRouteModule] Error getting current route:', error);
    return null;
  }
};

/**
 * Check microphone permission status
 * @returns 'granted' | 'denied' | 'undetermined'
 */
export const checkMicrophonePermission = async (): Promise<string> => {
  try {
    if (!isIOS || !AudioRouteManager) {
      return 'undetermined';
    }
    return await AudioRouteManager.checkMicrophonePermission();
  } catch (error) {
    console.error('[AudioRouteModule] Error checking permission:', error);
    return 'undetermined';
  }
};

/**
 * Request microphone permission
 * @returns 'granted' | 'denied'
 */
export const requestMicrophonePermission = async (): Promise<string> => {
  try {
    if (!isIOS || !AudioRouteManager) {
      return 'denied';
    }
    return await AudioRouteManager.requestMicrophonePermission();
  } catch (error) {
    console.error('[AudioRouteModule] Error requesting permission:', error);
    return 'denied';
  }
};

/**
 * Listen for audio route changes (AirPods connect/disconnect, etc.)
 */
export const onRouteChange = (callback: (event: AudioRouteChangeEvent) => void): (() => void) => {
  try {
    if (!routeEmitter) {
      console.warn('[AudioRouteModule] Route emitter not available');
      return () => {};
    }
    const subscription = routeEmitter.addListener('onAudioRouteChange', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[AudioRouteModule] Error setting up route listener:', error);
    return () => {};
  }
};

/**
 * Listen for bluetooth device changes
 */
export const onBluetoothDeviceChange = (callback: (event: AudioRouteInfo) => void): (() => void) => {
  try {
    if (!routeEmitter) {
      return () => {};
    }
    const subscription = routeEmitter.addListener('onBluetoothDeviceChange', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[AudioRouteModule] Error setting up bluetooth listener:', error);
    return () => {};
  }
};

export default {
  getCurrentRoute,
  checkMicrophonePermission,
  requestMicrophonePermission,
  onRouteChange,
  onBluetoothDeviceChange,
};
