import { NativeModules, Platform } from 'react-native';

const { AlertActionManager } = NativeModules;

const isIOS = Platform.OS === 'ios';

interface AlertSettings {
  hapticEnabled: boolean;
  audioEnabled: boolean;
}

let currentSettings: AlertSettings = {
  hapticEnabled: true,
  audioEnabled: true,
};

export const updateAlertSettings = (settings: AlertSettings) => {
  currentSettings = settings;
};

export const triggerAlert = () => {
  try {
    if (!isIOS || !AlertActionManager) {
      console.warn('[AlertService] AlertActionManager not available on this platform');
      return;
    }

    if (currentSettings.hapticEnabled) {
      AlertActionManager.triggerHaptic();
    }

    if (currentSettings.audioEnabled) {
      AlertActionManager.playWarningWithDucking();

      setTimeout(() => {
        try {
          AlertActionManager.restoreAudio();
        } catch (error) {
          console.error('[AlertService] Error restoring audio:', error);
        }
      }, 3000);
    }
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
