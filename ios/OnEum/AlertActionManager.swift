import Foundation
import AVFoundation
import UIKit

@objc(AlertActionManager)
class AlertActionManager: NSObject {
  
  private var warningPlayer: AVAudioPlayer?
  private var alertVolume: Float = 1.0
  private var hapticPattern: String = "strong" // "soft", "medium", "strong"
  
  // ─── Settings ───
  @objc func setAlertVolume(_ volume: Float) {
    alertVolume = max(0.0, min(1.0, volume))
    NSLog("[AlertActionManager] Alert volume set to: \(alertVolume)")
  }
  
  @objc func setHapticPattern(_ pattern: String) {
    hapticPattern = pattern
    NSLog("[AlertActionManager] Haptic pattern set to: \(pattern)")
  }
  
  // ─── Haptic Feedback ───
  @objc func triggerHaptic() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      
      switch self.hapticPattern {
      case "soft":
        self.triggerSoftHaptic()
      case "medium":
        self.triggerMediumHaptic()
      case "strong":
        self.triggerStrongHaptic()
      default:
        self.triggerStrongHaptic()
      }
      
      NSLog("[AlertActionManager] Haptic triggered (pattern: \(self.hapticPattern))")
    }
  }
  
  private func triggerSoftHaptic() {
    let generator = UINotificationFeedbackGenerator()
    generator.prepare()
    generator.notificationOccurred(.warning)
  }
  
  private func triggerMediumHaptic() {
    let generator = UINotificationFeedbackGenerator()
    generator.prepare()
    generator.notificationOccurred(.error)
    
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
      let impact = UIImpactFeedbackGenerator(style: .medium)
      impact.prepare()
      impact.impactOccurred()
    }
  }
  
  private func triggerStrongHaptic() {
    let generator = UINotificationFeedbackGenerator()
    generator.prepare()
    generator.notificationOccurred(.error)
    
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
      let impact = UIImpactFeedbackGenerator(style: .heavy)
      impact.prepare()
      impact.impactOccurred()
    }
    
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
      let impact = UIImpactFeedbackGenerator(style: .heavy)
      impact.prepare()
      impact.impactOccurred()
    }
    
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
      let impact = UIImpactFeedbackGenerator(style: .rigid)
      impact.prepare()
      impact.impactOccurred()
    }
  }
  
  // ─── Audio Alert ───
  @objc func playWarningWithDucking() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playback, mode: .default, options: [.duckOthers])
      try session.setActive(true)
      
      guard let url = Bundle.main.url(forResource: "warning_beep", withExtension: "mp3") else {
        NSLog("[AlertActionManager] Warning beep file not found")
        return
      }
      
      warningPlayer = try AVAudioPlayer(contentsOf: url)
      warningPlayer?.volume = alertVolume
      warningPlayer?.numberOfLoops = 0
      warningPlayer?.prepareToPlay()
      warningPlayer?.play()
      
      NSLog("[AlertActionManager] Warning played (volume: \(alertVolume))")
    } catch {
      NSLog("[AlertActionManager] Failed to play warning: \(error)")
    }
  }
  
  // ─── Restore Audio ───
  @objc func restoreAudio() {
    warningPlayer?.stop()
    warningPlayer = nil
    
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setActive(false, options: .notifyOthersOnDeactivation)
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .mixWithOthers])
      try session.setActive(true)
      NSLog("[AlertActionManager] Audio session restored")
    } catch {
      NSLog("[AlertActionManager] Failed to restore audio: \(error)")
    }
  }
}
