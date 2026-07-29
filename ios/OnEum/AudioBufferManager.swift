import Foundation
import AVFoundation
import React

@objc(AudioBufferManager)
class AudioBufferManager: RCTEventEmitter {
  
  private var audioEngine: AVAudioEngine?
  private var isRecording = false
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func supportedEvents() -> [String]! {
    return ["onAudioBuffer"]
  }
  
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
    let format = inputNode.outputFormat(forBus: 0)
    
    let bufferSize: AVAudioFrameCount = AVAudioFrameCount(format.sampleRate * 0.1)
    
    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, _ in
      guard let self = self else { return }
      
      guard let channelData = buffer.floatChannelData?[0] else {
        NSLog("[AudioBufferManager] Failed to get channel data")
        return
      }
      
      let frameLength = Int(buffer.frameLength)
      
      var rms: Float = 0
      for i in 0..<frameLength {
        let sample = channelData[i]
        rms += sample * sample
      }
      rms = sqrt(rms / Float(frameLength))
      
      let bufferData: [Float] = Array(UnsafeBufferPointer(start: channelData, count: min(frameLength, 1024)))
      
      self.sendEvent(withName: "onAudioBuffer", body: [
        "rms": rms,
        "sampleRate": format.sampleRate,
        "frameLength": frameLength,
        "samples": bufferData.map { NSNumber(value: $0) }
      ])
    }
    
    do {
      try engine.start()
      isRecording = true
      NSLog("[AudioBufferManager] Audio engine started successfully")
    } catch {
      NSLog("[AudioBufferManager] Failed to start audio engine: \(error)")
      isRecording = false
      audioEngine = nil
    }
  }
  
  @objc func stopListening() {
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    audioEngine = nil
    isRecording = false
    NSLog("[AudioBufferManager] Audio engine stopped")
  }
  
  private func configureAudioSession() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])
    try session.setActive(true)
    NSLog("[AudioBufferManager] Audio session configured successfully")
  }
}
