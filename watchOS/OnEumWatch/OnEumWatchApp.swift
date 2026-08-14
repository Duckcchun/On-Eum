/**
 * 온음 Apple Watch App
 *
 * 기능:
 * - iPhone에서 위험 감지 시 즉시 햅틱 알림
 * - 현재 보호 모드 상태 표시
 * - 위험 유형 + 방향 표시
 * - 워치에서 보호 모드 ON/OFF 토글
 *
 * 설정 방법:
 * 1. Xcode에서 File → New → Target → watchOS → Watch App 추가
 * 2. 이 폴더의 Swift 파일들을 Watch 타겟에 추가
 * 3. Signing → Apple Developer 팀 선택
 * 4. iPhone 앱 타겟에 Watch App을 Embed
 */

import SwiftUI
import WatchConnectivity

@main
struct OnEumWatchApp: App {
  @StateObject private var connectivityManager = WatchConnectivityManager.shared
  
  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(connectivityManager)
    }
  }
}
