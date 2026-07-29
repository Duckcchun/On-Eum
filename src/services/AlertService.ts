import { NativeModules, Platform } from 'react-native';

const { AlertActionManager } = NativeModules;

const isIOS = Platform.OS === 'ios';

export const triggerAlert = () => {
  try {
    if (!isIOS || !AlertActionManager) {
      console.warn('[AlertService] AlertActionManager not available on this platform');
      return;
    }

    AlertActionManager.triggerHaptic();
    AlertActionManager.playWarningWithDucking();

    setTimeout(() => {
      try {
        AlertActionManager.restoreAudio();
      } catch (error) {
        console.error('[AlertService] Error restoring audio:', error);
      }
    }, 3000);
  } catch (error) {
    console.error('[AlertService] Error triggering alert:', error);
  }
};

export const stopAlert = () => {
  try {
    if (!isIOS || !AlertActionManager) {
      console.warn('[AlertService] AlertActionManager not available on this platform');
      return;
    }
    AlertActionManager.restoreAudio();
  } catch (error) {
    console.error('[AlertService] Error stopping alert:', error);
  }
};

export default {
  triggerAlert,
  stopAlert,
};
