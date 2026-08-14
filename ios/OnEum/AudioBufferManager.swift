import Foundation
import AVFoundation
import React

@objc(AudioBufferManager)
class AudioBufferManager: RCTEventEmitter {
  
  private var audioEngine: AVAudioEngine?
  private var isRecording = false
  private var isAdaptiveMode = false
  private var currentBufferDuration: Double = 0.1 // 기본 0.1초
  private let normalBufferDuration: Double = 0.3  // 평상시 (배터리 절약)
  private let alertBufferDuration: Double = 0.1   // 소리 감지 시 (높은 정확도)
  private var silenceCounter = 0
  private let silenceThresholdToNormal = 30 // 3초간 조용하면 normal 모드로
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func supportedEvents() -> [String]! {
    return ["onAudioBuffer", "onAudioInterruption", "onBackgroundStateChange"]
  }
  
  override init() {
    super.init()
    setupNotifications()
  }
  
  // ─── Notification Observers ───
  private func setupNotifications() {
    // Audio session interruption (phone call, Siri, etc.)
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleInterruption),
      name: AVAudioSession.interruptionNotification,
      object: nil
    )
    
    // App background/foreground transitions
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppDidEnterBackground),
      name: UIApplication.didEnterBackgroundNotification,
      object: nil
    )
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
    
    // Media server reset (rare but important)
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleMediaServicesReset),
      name: AVAudioSession.mediaServicesWereResetNotification,
      object: nil
    )
  }
  
  // ─── Interruption Handling ───
  @objc private func handleInterruption(_ notification: Notification) {
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }
    
    switch type {
    case .began:
      NSLog("[AudioBufferManager] Audio interruption began (e.g. phone call)")
      sendEvent(withName: "onAudioInterruption", body: ["type": "began"])
      
    case .ended:
      NSLog("[AudioBufferManager] Audio interruption ended")
      
      // Check if we should resume
      if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
        let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
        if options.contains(.shouldResume) {
          // Resume audio engine after interruption
          resumeAfterInterruption()
        }
      }
      sendEvent(withName: "onAudioInterruption", body: ["type": "ended"])
      
    @unknown default:
      break
    }
  }
  
  @objc private func handleAppDidEnterBackground() {
    NSLog("[AudioBufferManager] App entered background - audio continues")
    sendEvent(withName: "onBackgroundStateChange", body: ["isBackground": true])
    
    // Switch to adaptive mode in background to save battery
    if isRecording {
      switchToAdaptiveMode(true)
    }
  }
  
  @objc private func handleAppWillEnterForeground() {
    NSLog("[AudioBufferManager] App entering foreground")
    sendEvent(withName: "onBackgroundStateChange", body: ["isBackground": false])
    
    // Restore normal detection mode
    if isRecording {
      switchToAdaptiveMode(false)
    }
  }
  
  @objc private func handleMediaServicesReset() {
    NSLog("[AudioBufferManager] Media services reset - restarting engine")
    // Media server crashed and restarted - need to recreate everything
    stopListening()
    
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
      self?.startListening()
    }
  }
  
  // ─── Resume after interruption ───
  private func resumeAfterInterruption() {
    guard isRecording else { return }
    
    do {
      try configureAudioSession()
      try audioEngine?.start()
      NSLog("[AudioBufferManager] Audio engine resumed after interruption")
    } catch {
      NSLog("[AudioBufferManager] Failed to resume after interruption: \(error)")
      // Try full restart
      stopListening()
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
        self?.startListening()
      }
    }
  }
  
  // ─── Adaptive Mode ───
  private func switchToAdaptiveMode(_ enabled: Bool) {
    isAdaptiveMode = enabled
    if enabled {
      currentBufferDuration = normalBufferDuration
      NSLog("[AudioBufferManager] Switched to adaptive mode (battery saving)")
    } else {
      currentBufferDuration = alertBufferDuration
      NSLog("[AudioBufferManager] Switched to normal mode (high accuracy)")
    }
    
    // Restart tap with new buffer size
    if isRecording {
      restartTapWithCurrentDuration()
    }
  }
  
  @objc func setAdaptiveMode(_ enabled: Bool) {
    switchToAdaptiveMode(enabled)
  }
  
  private func restartTapWithCurrentDuration() {
    guard let engine = audioEngine else { return }
    
    let inputNode = engine.inputNode
    inputNode.removeTap(onBus: 0)
    
    let inputFormat = inputNode.outputFormat(forBus: 0)
    let bufferSize = AVAudioFrameCount(inputFormat.sampleRate * currentBufferDuration)
    
    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: inputFormat) { [weak self] buffer, _ in
      self?.processBuffer(buffer, format: inputFormat)
    }
    
    NSLog("[AudioBufferManager] Tap restarted with buffer duration: \(currentBufferDuration)s")
  }
  
  // ─── Main Listening ───
  @objc func startListening() {
    guard !isRecording else {
      NSLog("[AudioBufferManager] Already recording")
      return
    }
    
    do {
      try configureAudioSession()
    } catch {
      NSLog("[AudioBufferManager] Failed to configure audio session: \(error)")
      return
    }
    
    audioEngine = AVAudioEngine()
    guard let engine = audioEngine else {
      NSLog("[AudioBufferManager] Failed to create audio engine")
      return
    }
    
    let inputNode = engine.inputNode
    let inputFormat = inputNode.outputFormat(forBus: 0)
    
    // Start with adaptive duration if in background
    let bufferDuration = isAdaptiveMode ? normalBufferDuration : alertBufferDuration
    currentBufferDuration = bufferDuration
    let bufferSize = AVAudioFrameCount(inputFormat.sampleRate * bufferDuration)
    
    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: inputFormat) { [weak self] buffer, _ in
      self?.processBuffer(buffer, format: inputFormat)
    }
    
    do {
      try engine.start()
      isRecording = true
      NSLog("[AudioBufferManager] Audio engine started (buffer: \(bufferDuration)s)")
    } catch {
      NSLog("[AudioBufferManager] Failed to start audio engine: \(error)")
      isRecording = false
      audioEngine = nil
    }
  }
  
  // ─── Buffer Processing ───
  private func processBuffer(_ buffer: AVAudioPCMBuffer, format: AVAudioFormat) {
    guard let channelData = buffer.floatChannelData?[0] else { return }
    
    let frameLength = Int(buffer.frameLength)
    
    // Calculate RMS
    var rms: Float = 0
    for i in 0..<frameLength {
      let sample = channelData[i]
      rms += sample * sample
    }
    rms = sqrt(rms / Float(frameLength))
    
    // Adaptive mode: switch buffer duration based on RMS
    if isAdaptiveMode {
      if rms > 0.05 { // Some sound detected
        silenceCounter = 0
        if currentBufferDuration != alertBufferDuration {
          currentBufferDuration = alertBufferDuration
          // Don't restart tap here (causes glitch), just note the state change
          NSLog("[AudioBufferManager] Adaptive: sound detected, high accuracy mode")
        }
      } else {
        silenceCounter += 1
        if silenceCounter >= silenceThresholdToNormal && currentBufferDuration != normalBufferDuration {
          currentBufferDuration = normalBufferDuration
          NSLog("[AudioBufferManager] Adaptive: silence, battery saving mode")
        }
      }
    }
    
    // Send to JS (limit samples to reduce bridge overhead)
    let sampleCount = min(frameLength, 512)
    let bufferData: [Float] = Array(UnsafeBufferPointer(start: channelData, count: sampleCount))
    
    self.sendEvent(withName: "onAudioBuffer", body: [
      "rms": rms,
      "sampleRate": format.sampleRate,
      "frameLength": frameLength,
      "samples": bufferData.map { NSNumber(value: $0) },
      "isAdaptive": isAdaptiveMode,
      "bufferDuration": currentBufferDuration
    ])
  }
  
  // ─── Stop ───
  @objc func stopListening() {
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    audioEngine = nil
    isRecording = false
    silenceCounter = 0
    NSLog("[AudioBufferManager] Audio engine stopped")
  }
  
  // ─── Audio Session Configuration ───
  private func configureAudioSession() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(
      .playAndRecord,
      mode: .default,
      options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .mixWithOthers]
    )
    try session.setActive(true, options: .notifyOthersOnDeactivation)
    NSLog("[AudioBufferManager] Audio session configured (background capable)")
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
    stopListening()
  }
}
