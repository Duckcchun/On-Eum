# 온음 (On-Eum)

에어팟 노이즈 캔슬링 보행자를 위한 킥보드/차량 위험음 감지 iOS 앱 MVP

## 기술 스택

- React Native (Bare Workflow)
- NativeWind (Tailwind CSS)
- iOS Native Module (Swift)
- TensorFlow Lite (예정)

## 요구 사항

- macOS (Ventura 이상 권장)
- Xcode 15+
- Node.js 18+
- CocoaPods
- 실제 iPhone 기기 (시뮬레이터에서는 마이크/햅틱 불가)

## 빠른 시작

```bash
git clone -b feat/mvp-full-implementation https://github.com/Duckcchun/On-Eum.git
cd On-Eum
chmod +x setup.sh
./setup.sh
```

## 수동 셋업

```bash
npm install
cd ios && pod install && cd ..
```

## 실행

### 터미널

```bash
npx react-native run-ios --device
```

### Xcode

1. `ios/OnEum.xcworkspace` 를 Xcode로 열기
2. 실제 iPhone 기기 연결
3. Signing & Capabilities 에서 본인 Apple ID 팀 선택
4. Build & Run

## 경고음 파일 추가

`ios/OnEum/warning_beep.mp3` 경로에 경고 비프음 파일을 넣어주세요.
Xcode에서 Build Phases → Copy Bundle Resources 에 추가되어 있어야 합니다.

## 프로젝트 구조

```
On-Eum/
├── App.tsx                     앱 진입점
├── src/
│   ├── screens/
│   │   └── Dashboard.tsx       메인 화면 (토글, 로그)
│   ├── native/
│   │   └── AudioBufferModule.ts  Native Bridge JS 래퍼
│   └── services/
│       ├── AlertService.ts     경고 트리거 (Haptic + Ducking)
│       └── ThreatDetector.ts   위협 판별 로직
└── ios/OnEum/
    ├── AudioBufferManager.swift  마이크 버퍼 수집 (0.1초 단위)
    ├── AlertActionManager.swift  Haptic 진동 + Audio Ducking
    ├── AppDelegate.swift         앱 시작점
    └── Info.plist                권한 설정
```

## 동작 흐름

1. 안전 모드 ON → 마이크 수집 시작
2. AudioBufferManager가 0.1초 간격으로 오디오 버퍼를 JS로 전달
3. ThreatDetector가 RMS 임계값 기반으로 위험 판별
4. 위험 감지 시 0.2초 이내:
   - 강한 Haptic 진동 (3연타)
   - 음악 볼륨 자동 감소 (Audio Ducking)
   - warning_beep.mp3 최대 볼륨 재생
5. 3초 후 자동 복원

## Xcode 프로젝트 생성 (최초 1회)

이 레포는 `.xcodeproj`가 포함되어 있지 않습니다.
아래 방법으로 프로젝트를 생성한 뒤 소스를 연결하세요:

```bash
npx react-native init OnEum --template react-native-template-typescript
```

생성된 프로젝트의 `ios/` 폴더에 이 레포의 Swift/ObjC 파일을 복사합니다:
- `AudioBufferManager.swift` / `.m`
- `AlertActionManager.swift` / `.m`
- `AppDelegate.swift`
- `OnEum-Bridging-Header.h`
- `Info.plist` (내용 병합)
- `LaunchScreen.storyboard`

그 다음 `pod install` 을 다시 실행합니다.

## 라이선스

MIT
