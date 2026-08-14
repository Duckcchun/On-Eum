import { NativeModules, Platform } from 'react-native';

const { AlertActionManager } = NativeModules;

const isIOS = Platform.OS === 'ios';

export interface AlertSettings {
  hapticEnabled: boolean;
  audioEnabled: boolean;
  alertVolume: number;         // 0.0 ~ 1.0
  hapticPattern: 'soft' | 'medium' | 'strong';
}

let currentSettings: AlertSettings = {
  hapticEnabled: true,
  audioEnabled: true,
  alertVolume: 1.0,
  hapticPattern: 'strong',
};

export const updateAlertSettings = (settings: Partial<AlertSettings>) => {
  currentSettings = { ...currentSettings, ...settings };

  // Sync native settings
  if (isIOS && AlertActionManager) {
    if (settings.alertVolume !== undefined) {
      AlertActionManager.setAlertVolume(settings.alertVolume);
    }
    if (settings.hapticPattern !== undefined) {
      AlertActionManager.setHapticPattern(settings.hapticPattern);
    }
  }
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

export const getAlertSettings = (): AlertSettings => {
  return { ...currentSettings };
};

export default {
  triggerAlert,
  stopAlert,
  updateAlertSettings,
  getAlertSettings,
};
