import Foundation
import AVFoundation

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
    guard !isRecording else { return }
    
    configureAudioSession()
    
    audioEngine = AVAudioEngine()
    guard let audioEngine = audioEngine else { return }
    
    let inputNode = audioEngine.inputNode
    let format = inputNode.outputFormat(forBus: 0)
    
    let bufferSize: AVAudioFrameCount = AVAudioFrameCount(format.sampleRate * 0.1)
    
    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, _ in
      guard let self = self else { return }
      
      let channelData = buffer.floatChannelData?[0]
      let frameLength = Int(buffer.frameLength)
      
      var rms: Float = 0
      for i in 0..<frameLength {
        let sample = channelData?[i] ?? 0
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
      try audioEngine.start()
      isRecording = true
    } catch {
      isRecording = false
    }
  }
  
  @objc func stopListening() {
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    audioEngine = nil
    isRecording = false
  }
  
  private func configureAudioSession() {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])
      try session.setActive(true)
    } catch {}
  }
}
