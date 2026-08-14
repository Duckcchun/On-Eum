/**
 * WatchModule - Apple Watch 연동 JS 브릿지
 *
 * iPhone에서 Watch로 위험 감지 알림을 전송하고,
 * Watch에서의 사용자 액션(토글, 안전, 오탐)을 수신합니다.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { WatchSessionManager } = NativeModules;

const isIOS = Platform.OS === 'ios';
const watchEmitter = isIOS && WatchSessionManager
  ? new NativeEventEmitter(WatchSessionManager)
  : null;

export interface WatchStatus {
  isPaired: boolean;
  isReachable: boolean;
  isActivated: boolean;
  isWatchAppInstalled: boolean;
}

export interface WatchMessage {
  action: 'toggleProtection' | 'requestStatus' | 'dismissThreat' | 'markFalsePositive';
}

/**
 * Send a threat alert to Apple Watch (triggers haptic immediately)
 */
export const sendThreatToWatch = (
  type: string,
  icon: string,
  severity: string,
  direction: number,
  detectedAt: string
) => {
  try {
    if (!isIOS || !WatchSessionManager) return;
    WatchSessionManager.sendThreatAlert(type, icon, severity, direction, detectedAt);
  } catch (error) {
    console.error('[WatchModule] Error sending threat:', error);
  }
};

/**
 * Sync protection mode state to Watch
 */
export const syncProtectionState = (isActive: boolean) => {
  try {
    if (!isIOS || !WatchSessionManager) return;
    WatchSessionManager.syncProtectionState(isActive);
  } catch (error) {
    console.error('[WatchModule] Error syncing state:', error);
  }
};

/**
 * Sync detection count to Watch
 */
export const syncDetectionCount = (count: number) => {
  try {
    if (!isIOS || !WatchSessionManager) return;
    WatchSessionManager.syncDetectionCount(count);
  } catch (error) {
    console.error('[WatchModule] Error syncing count:', error);
  }
};

/**
 * Send dismiss signal to Watch
 */
export const sendDismissToWatch = () => {
  try {
    if (!isIOS || !WatchSessionManager) return;
    WatchSessionManager.sendDismiss();
  } catch (error) {
    console.error('[WatchModule] Error sending dismiss:', error);
  }
};

/**
 * Get Apple Watch connection status
 */
export const getWatchStatus = async (): Promise<WatchStatus | null> => {
  try {
    if (!isIOS || !WatchSessionManager) return null;
    return await WatchSessionManager.getWatchStatus();
  } catch (error) {
    console.error('[WatchModule] Error getting status:', error);
    return null;
  }
};

/**
 * Listen for messages from Apple Watch
 */
export const onWatchMessage = (callback: (message: WatchMessage) => void): (() => void) => {
  try {
    if (!watchEmitter) return () => {};
    const subscription = watchEmitter.addListener('onWatchMessage', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[WatchModule] Error setting up listener:', error);
    return () => {};
  }
};

/**
 * Listen for Watch reachability changes
 */
export const onWatchReachabilityChange = (callback: (data: { isReachable: boolean }) => void): (() => void) => {
  try {
    if (!watchEmitter) return () => {};
    const subscription = watchEmitter.addListener('onWatchReachabilityChange', callback);
    return () => subscription.remove();
  } catch (error) {
    console.error('[WatchModule] Error setting up reachability listener:', error);
    return () => {};
  }
};

export default {
  sendThreatToWatch,
  syncProtectionState,
  syncDetectionCount,
  sendDismissToWatch,
  getWatchStatus,
  onWatchMessage,
  onWatchReachabilityChange,
};
