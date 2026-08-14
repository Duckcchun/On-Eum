import SwiftUI

struct ContentView: View {
  @EnvironmentObject var connectivity: WatchConnectivityManager
  
  var body: some View {
    if connectivity.isDetecting, let threat = connectivity.currentThreat {
      DangerView(threat: threat)
    } else {
      SafeView()
    }
  }
}

// ─── Safe Mode View ───
struct SafeView: View {
  @EnvironmentObject var connectivity: WatchConnectivityManager
  
  var body: some View {
    ScrollView {
      VStack(spacing: 12) {
        // Status circle
        ZStack {
          Circle()
            .stroke(
              connectivity.isProtectionActive ? Color.green : Color.gray,
              lineWidth: 4
            )
            .frame(width: 80, height: 80)
          
          VStack(spacing: 2) {
            Text(connectivity.isProtectionActive ? "🛡️" : "⏸️")
              .font(.system(size: 24))
            Text(connectivity.isProtectionActive ? "SAFE" : "OFF")
              .font(.system(size: 12, weight: .bold))
              .foregroundColor(connectivity.isProtectionActive ? .green : .gray)
          }
        }
        .padding(.top, 8)
        
        // App name
        Text("온음")
          .font(.system(size: 16, weight: .bold))
        
        Text(connectivity.isProtectionActive ? "보호 모드 활성화" : "보호 모드 꺼짐")
          .font(.system(size: 12))
          .foregroundColor(.gray)
        
        // Today's detections
        if connectivity.todayDetections > 0 {
          HStack {
            Text("오늘 감지")
              .font(.system(size: 11))
              .foregroundColor(.gray)
            Spacer()
            Text("\(connectivity.todayDetections)건")
              .font(.system(size: 13, weight: .bold))
              .foregroundColor(.orange)
          }
          .padding(.horizontal, 8)
          .padding(.vertical, 6)
          .background(Color.orange.opacity(0.1))
          .cornerRadius(8)
        }
        
        // Toggle button
        Button(action: {
          connectivity.toggleProtectionMode()
        }) {
          HStack {
            Image(systemName: connectivity.isProtectionActive ? "stop.fill" : "play.fill")
              .font(.system(size: 12))
            Text(connectivity.isProtectionActive ? "끄기" : "켜기")
              .font(.system(size: 13, weight: .semibold))
          }
          .frame(maxWidth: .infinity)
          .padding(.vertical, 10)
          .background(connectivity.isProtectionActive ? Color.red.opacity(0.2) : Color.green.opacity(0.2))
          .cornerRadius(10)
        }
        .buttonStyle(.plain)
        
        // Connection status
        HStack {
          Circle()
            .fill(connectivity.isConnectedToPhone ? Color.green : Color.red)
            .frame(width: 6, height: 6)
          Text(connectivity.isConnectedToPhone ? "iPhone 연결됨" : "연결 안됨")
            .font(.system(size: 10))
            .foregroundColor(.gray)
        }
        .padding(.top, 4)
      }
      .padding(.horizontal, 8)
    }
  }
}

// ─── Danger Alert View ───
struct DangerView: View {
  @EnvironmentObject var connectivity: WatchConnectivityManager
  let threat: ThreatData
  
  var body: some View {
    ScrollView {
      VStack(spacing: 10) {
        // Danger icon
        Text(threat.icon)
          .font(.system(size: 36))
        
        // Type
        Text("위험 감지!")
          .font(.system(size: 14, weight: .bold))
          .foregroundColor(.red)
        
        Text(threat.type)
          .font(.system(size: 12))
          .foregroundColor(.white)
          .multilineTextAlignment(.center)
        
        // Direction
        VStack(spacing: 4) {
          Text("방향")
            .font(.system(size: 10))
            .foregroundColor(.gray)
          Text(threat.directionLabel)
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(.blue)
        }
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity)
        .background(Color.blue.opacity(0.1))
        .cornerRadius(8)
        
        // Time
        Text(threat.detectedAt)
          .font(.system(size: 10))
          .foregroundColor(.gray)
        
        // Action buttons
        HStack(spacing: 8) {
          Button(action: {
            connectivity.dismissThreat()
          }) {
            VStack(spacing: 2) {
              Text("✅")
                .font(.system(size: 16))
              Text("안전")
                .font(.system(size: 9))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color.green.opacity(0.2))
            .cornerRadius(8)
          }
          .buttonStyle(.plain)
          
          Button(action: {
            connectivity.markFalsePositive()
          }) {
            VStack(spacing: 2) {
              Text("❌")
                .font(.system(size: 16))
              Text("오탐")
                .font(.system(size: 9))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color.gray.opacity(0.2))
            .cornerRadius(8)
          }
          .buttonStyle(.plain)
        }
      }
      .padding(.horizontal, 8)
    }
    .background(Color.red.opacity(0.05))
  }
}
