import Foundation
import AVFoundation
import UIKit

@objc(AlertActionManager)
class AlertActionManager: NSObject {
  
  private var warningPlayer: AVAudioPlayer?
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc func triggerHaptic() {
    DispatchQueue.main.async {
      let generator = UINotificationFeedbackGenerator()
      generator.prepare()
      generator.notificationOccurred(.error)
      
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
        let impactGenerator = UIImpactFeedbackGenerator(style: .heavy)
        impactGenerator.prepare()
        impactGenerator.impactOccurred()
      }
      
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
        let impactGenerator = UIImpactFeedbackGenerator(style: .heavy)
        impactGenerator.prepare()
        impactGenerator.impactOccurred()
      }
    }
  }
  
  @objc func playWarningWithDucking() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playback, mode: .default, options: [.duckOthers])
      try session.setActive(true)
      
      guard let url = Bundle.main.url(forResource: "warning_beep", withExtension: "mp3") else { return }
      
      warningPlayer = try AVAudioPlayer(contentsOf: url)
      warningPlayer?.volume = 1.0
      warningPlayer?.numberOfLoops = 0
      warningPlayer?.prepareToPlay()
      warningPlayer?.play()
    } catch {}
  }
  
  @objc func restoreAudio() {
    warningPlayer?.stop()
    warningPlayer = nil
    
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setActive(false, options: .notifyOthersOnDeactivation)
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])
      try session.setActive(true)
    } catch {}
  }
}
