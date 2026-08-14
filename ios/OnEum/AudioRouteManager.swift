import Foundation
import AVFoundation
import React

@objc(AudioRouteManager)
class AudioRouteManager: RCTEventEmitter {
  
  private var isMonitoring = false
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return ["onAudioRouteChange", "onBluetoothDeviceChange"]
  }
  
  override init() {
    super.init()
    startRouteMonitoring()
  }
  
  // ─── Route Monitoring ───
  private func startRouteMonitoring() {
    guard !isMonitoring else { return }
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleRouteChange),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
    
    isMonitoring = true
    NSLog("[AudioRouteManager] Route monitoring started")
  }
  
  @objc private func handleRouteChange(_ notification: Notification) {
    guard let userInfo = notification.userInfo,
          let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
          let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
      return
    }
    
    let currentRoute = getCurrentRouteInfo()
    
    var reasonString: String
    switch reason {
    case .newDeviceAvailable:
      reasonString = "connected"
      NSLog("[AudioRouteManager] New device connected: \(currentRoute["outputName"] ?? "unknown")")
    case .oldDeviceUnavailable:
      reasonString = "disconnected"
      NSLog("[AudioRouteManager] Device disconnected")
    case .categoryChange:
      reasonString = "categoryChange"
    case .override:
      reasonString = "override"
    case .routeConfigurationChange:
      reasonString = "configChange"
    default:
      reasonString = "unknown"
    }
    
    var eventBody = currentRoute
    eventBody["reason"] = reasonString
    
    sendEvent(withName: "onAudioRouteChange", body: eventBody)
    sendEvent(withName: "onBluetoothDeviceChange", body: currentRoute)
  }
  
  // ─── Get Current Route Info ───
  @objc func getCurrentRoute(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let info = getCurrentRouteInfo()
    resolve(info)
  }
  
  private func getCurrentRouteInfo() -> [String: Any] {
    let session = AVAudioSession.sharedInstance()
    let route = session.currentRoute
    
    var outputName = "Speaker"
    var outputType = "builtInSpeaker"
    var isBluetoothConnected = false
    var isAirPods = false
    var deviceModel = ""
    
    // Check outputs
    for output in route.outputs {
      outputName = output.portName
      
      switch output.portType {
      case .bluetoothA2DP, .bluetoothLE, .bluetoothHFP:
        isBluetoothConnected = true
        outputType = "bluetooth"
        deviceModel = output.portName
        
        // Check if it's AirPods (name typically contains "AirPods")
        let lowercaseName = output.portName.lowercased()
        isAirPods = lowercaseName.contains("airpod") ||
                    lowercaseName.contains("air pod") ||
                    lowercaseName.contains("에어팟")
        
      case .headphones:
        outputType = "wiredHeadphones"
        
      case .builtInSpeaker:
        outputType = "builtInSpeaker"
        
      case .builtInReceiver:
        outputType = "builtInReceiver"
        
      default:
        outputType = output.portType.rawValue
      }
    }
    
    // Check inputs for microphone
    var inputName = "Built-in Mic"
    var hasExternalMic = false
    for input in route.inputs {
      inputName = input.portName
      if input.portType == .bluetoothHFP {
        hasExternalMic = true
      }
    }
    
    return [
      "outputName": outputName,
      "outputType": outputType,
      "inputName": inputName,
      "isBluetoothConnected": isBluetoothConnected,
      "isAirPods": isAirPods,
      "hasExternalMic": hasExternalMic,
      "deviceModel": deviceModel,
    ]
  }
  
  // ─── Check Microphone Permission ───
  @objc func checkMicrophonePermission(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    switch AVAudioSession.sharedInstance().recordPermission {
    case .granted:
      resolve("granted")
    case .denied:
      resolve("denied")
    case .undetermined:
      resolve("undetermined")
    @unknown default:
      resolve("unknown")
    }
  }
  
  @objc func requestMicrophonePermission(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    AVAudioSession.sharedInstance().requestRecordPermission { granted in
      resolve(granted ? "granted" : "denied")
    }
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
}
