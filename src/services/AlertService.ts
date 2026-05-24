import { NativeModules } from 'react-native';

const { AlertActionManager } = NativeModules;

export const triggerAlert = () => {
  AlertActionManager.triggerHaptic();
  AlertActionManager.playWarningWithDucking();

  setTimeout(() => {
    AlertActionManager.restoreAudio();
  }, 3000);
};

export const stopAlert = () => {
  AlertActionManager.restoreAudio();
};

export default {
  triggerAlert,
  stopAlert,
};
