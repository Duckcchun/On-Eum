import Foundation
import WatchConnectivity
import React

/**
 * WatchSessionManager - iPhone 측 WatchConnectivity 관리
 *
 * iPhone → Watch:
 * - 위험 감지 알림 전송 (유형, 아이콘, 방향, 시간)
 * - 보호 모드 상태 동기화
 * - 감지 통계 업데이트
 *
 * Watch → iPhone:
 * - 보호 모드 토글 수신
 * - 현재 상태 요청 수신
 * - 안전/오탐 피드백 수신
 *
 * 설정:
 * 1. Xcode → iPhone 타겟 → Signing & Capabilities → + Capability → WatchConnectivity (불필요, 프레임워크만 링크)
 * 2. 이 파일은 AppDelegate에서 초기화됨
 */
@objc(WatchSessionManager)
class WatchSessionManager: RCTEventEmitter {
  
  static var shared: WatchSessionManager?
  
  private var wcSession: WCSession?
  private var isProtectionActive: Bool = false
  private var todayDetections: Int = 0
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return ["onWatchMessage", "onWatchReachabilityChange"]
  }
  
  override init() {
    super.init()
    WatchSessionManager.shared = self
    setupSession()
  }
  
  // ─── Session Setup ───
  private func setupSession() {
    guard WCSession.isSupported() else {
      NSLog("[WatchSession] WCSession not supported on this device")
      return
    }
    
    wcSession = WCSession.default
    wcSession?.delegate = self
    wcSession?.activate()
    NSLog("[WatchSession] Session activation requested")
  }
  
  // ─── Send to Watch ───
  
  /// Send threat alert to Watch (triggers haptic on Watch immediately)
  @objc func sendThreatAlert(_ type: String, icon: String, severity: String, direction: Double, detectedAt: String) {
    let message: [String: Any] = [
      "threatType": type,
      "threatIcon": icon,
      "severity": severity,
      "direction": direction,
      "detectedAt": detectedAt,
    ]
    
    sendToWatch(message)
    NSLog("[WatchSession] Threat alert sent: \(type)")
  }
  
  /// Sync protection mode state to Watch
  @objc func syncProtectionState(_ isActive: Bool) {
    isProtectionActive = isActive
    
    let context: [String: Any] = [
      "isProtectionActive": isActive,
      "todayDetections": todayDetections,
    ]
    
    // Use application context for persistent state sync
    try? wcSession?.updateApplicationContext(context)
    
    // Also send immediately if reachable
    sendToWatch(context)
    NSLog("[WatchSession] Protection state synced: \(isActive)")
  }
  
  /// Update today's detection count on Watch
  @objc func syncDetectionCount(_ count: Int) {
    todayDetections = count
    
    let context: [String: Any] = [
      "isProtectionActive": isProtectionActive,
      "todayDetections": count,
    ]
    
    try? wcSession?.updateApplicationContext(context)
    NSLog("[WatchSession] Detection count synced: \(count)")
  }
  
  /// Send dismiss signal to Watch
  @objc func sendDismiss() {
    sendToWatch(["action": "dismiss"])
  }
  
  /// Check if Watch is paired and reachable
  @objc func getWatchStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let session = wcSession else {
      resolve(["isPaired": false, "isReachable": false, "isActivated": false])
      return
    }
    
    resolve([
      "isPaired": session.isPaired,
      "isReachable": session.isReachable,
      "isActivated": session.activationState == .activated,
      "isWatchAppInstalled": session.isWatchAppInstalled,
    ])
  }
  
  // ─── Private Helpers ───
  private func sendToWatch(_ message: [String: Any]) {
    guard let session = wcSession else { return }
    
    if session.isReachable {
      session.sendMessage(message, replyHandler: nil, errorHandler: { error in
        NSLog("[WatchSession] Send error: \(error.localizedDescription)")
        // Fallback: use transferUserInfo for background delivery
        session.transferUserInfo(message)
      })
    } else {
      // Watch not reachable right now, queue it
      session.transferUserInfo(message)
    }
  }
}

// ─── WCSessionDelegate ───
extension WatchSessionManager: WCSessionDelegate {
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if let error = error {
      NSLog("[WatchSession] Activation failed: \(error)")
      return
    }
    NSLog("[WatchSession] Activated: \(activationState.rawValue), paired: \(session.isPaired)")
  }
  
  func sessionDidBecomeInactive(_ session: WCSession) {
    NSLog("[WatchSession] Session became inactive")
  }
  
  func sessionDidDeactivate(_ session: WCSession) {
    NSLog("[WatchSession] Session deactivated, reactivating...")
    session.activate()
  }
  
  func sessionReachabilityDidChange(_ session: WCSession) {
    NSLog("[WatchSession] Reachability changed: \(session.isReachable)")
    sendEvent(withName: "onWatchReachabilityChange", body: [
      "isReachable": session.isReachable
    ])
  }
  
  /// Receive messages from Watch
  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    handleWatchMessage(message)
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    handleWatchMessage(message)
    replyHandler([
      "isProtectionActive": isProtectionActive,
      "todayDetections": todayDetections,
    ])
  }
  
  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    handleWatchMessage(userInfo)
  }
  
  private func handleWatchMessage(_ message: [String: Any]) {
    guard let action = message["action"] as? String else { return }
    
    NSLog("[WatchSession] Received from Watch: \(action)")
    
    // Forward to JS
    sendEvent(withName: "onWatchMessage", body: ["action": action])
  }
}
