import Foundation
import WatchConnectivity
import WatchKit

/**
 * WatchConnectivityManager - iPhone ↔ Watch 통신 관리
 *
 * iPhone → Watch:
 * - 위험 감지 알림 (유형, 방향, 시간)
 * - 보호 모드 상태 변경
 * - 감지 통계 업데이트
 *
 * Watch → iPhone:
 * - 보호 모드 토글 요청
 * - 현재 상태 요청
 */
class WatchConnectivityManager: NSObject, ObservableObject {
  static let shared = WatchConnectivityManager()
  
  // ─── Published State ───
  @Published var isProtectionActive: Bool = false
  @Published var isDetecting: Bool = false
  @Published var currentThreat: ThreatData? = nil
  @Published var todayDetections: Int = 0
  @Published var isConnectedToPhone: Bool = false
  @Published var lastSyncTime: Date? = nil
  
  private var session: WCSession?
  
  override init() {
    super.init()
    setupSession()
  }
  
  // ─── Session Setup ───
  private func setupSession() {
    guard WCSession.isSupported() else {
      print("[Watch] WCSession not supported")
      return
    }
    
    session = WCSession.default
    session?.delegate = self
    session?.activate()
  }
  
  // ─── Send to iPhone ───
  
  /// Request protection mode toggle
  func toggleProtectionMode() {
    sendMessage(["action": "toggleProtection"])
  }
  
  /// Request current status from iPhone
  func requestStatus() {
    sendMessage(["action": "requestStatus"])
  }
  
  /// Dismiss current threat from Watch
  func dismissThreat() {
    currentThreat = nil
    isDetecting = false
    sendMessage(["action": "dismissThreat"])
  }
  
  /// Mark as false positive from Watch
  func markFalsePositive() {
    currentThreat = nil
    isDetecting = false
    sendMessage(["action": "markFalsePositive"])
  }
  
  private func sendMessage(_ message: [String: Any]) {
    guard let session = session, session.isReachable else {
      print("[Watch] iPhone not reachable")
      // Try transferUserInfo for background delivery
      session?.transferUserInfo(message)
      return
    }
    
    session.sendMessage(message, replyHandler: { reply in
      print("[Watch] Reply received: \(reply)")
    }, errorHandler: { error in
      print("[Watch] Send error: \(error)")
    })
  }
}

// ─── WCSessionDelegate ───
extension WatchConnectivityManager: WCSessionDelegate {
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    DispatchQueue.main.async {
      self.isConnectedToPhone = (activationState == .activated)
    }
    
    if activationState == .activated {
      print("[Watch] Session activated")
      requestStatus()
    }
  }
  
  /// Receive messages from iPhone (foreground)
  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    handleIncomingMessage(message)
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    handleIncomingMessage(message)
    replyHandler(["status": "received"])
  }
  
  /// Receive application context (background state sync)
  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    handleIncomingMessage(applicationContext)
  }
  
  /// Receive user info (queued messages)
  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    handleIncomingMessage(userInfo)
  }
  
  // ─── Message Handler ───
  private func handleIncomingMessage(_ message: [String: Any]) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      
      // Protection mode state
      if let isActive = message["isProtectionActive"] as? Bool {
        self.isProtectionActive = isActive
      }
      
      // Detection count
      if let count = message["todayDetections"] as? Int {
        self.todayDetections = count
      }
      
      // Threat alert!
      if let threatType = message["threatType"] as? String {
        let threat = ThreatData(
          type: threatType,
          icon: message["threatIcon"] as? String ?? "⚠️",
          severity: message["severity"] as? String ?? "danger",
          direction: message["direction"] as? Double ?? 0.0,
          detectedAt: message["detectedAt"] as? String ?? ""
        )
        
        self.currentThreat = threat
        self.isDetecting = true
        
        // Trigger haptic on Watch!
        self.triggerWatchHaptic(severity: threat.severity)
        
        // Auto dismiss after 8 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) {
          if self.isDetecting {
            self.isDetecting = false
            self.currentThreat = nil
          }
        }
      }
      
      // Dismiss signal
      if let action = message["action"] as? String, action == "dismiss" {
        self.isDetecting = false
        self.currentThreat = nil
      }
      
      self.lastSyncTime = Date()
    }
  }
  
  // ─── Watch Haptic ───
  private func triggerWatchHaptic(severity: String) {
    let device = WKInterfaceDevice.current()
    
    switch severity {
    case "danger":
      // Strong: 3 haptics
      device.play(.failure)
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
        device.play(.retry)
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
        device.play(.failure)
      }
      
    case "warning":
      // Medium: 2 haptics
      device.play(.notification)
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
        device.play(.directionUp)
      }
      
    default:
      device.play(.click)
    }
  }
}

// ─── Threat Data Model ───
struct ThreatData: Identifiable {
  let id = UUID()
  let type: String
  let icon: String
  let severity: String
  let direction: Double
  let detectedAt: String
  
  var directionLabel: String {
    if direction < -0.3 { return "← 좌측" }
    if direction > 0.3 { return "우측 →" }
    return "정면/후방"
  }
  
  var severityColor: String {
    switch severity {
    case "danger": return "red"
    case "warning": return "orange"
    default: return "blue"
    }
  }
}
