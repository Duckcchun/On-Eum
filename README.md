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

## 현재 구현된 기능 및 완성도

### ✅ 완성된 기능 (MVP 수준)

**1. 네이티브 오디오 처리**
- iOS Swift 네이티브 모듈 (AudioBufferManager) 구현
- 실시간 오디오 버퍼 수집 (0.1초 간격)
- RMS 기반 소음 레벨 계산
- React Native 브릿지를 통한 JavaScript 데이터 전달

**2. 위협 감지 시스템**
- 임계값 기반 위험 판별 로직
- 실시간 감지 로그 기록
- 감지 통계 추적 (총 감지 횟수, 활동 시간)

**3. 경고 알림 시스템**
- 햅틱 피드백 (3단계 진동 패턴)
- 오디오 덕킹 (음악 볼륨 자동 감소)
- 경고음 재생 (warning_beep.mp3)
- 자동 복원 기능 (3초 후)

**4. 사용자 인터페이스**
- 현대적인 다크 테마 디자인
- 실시간 상태 표시 (활성/대기)
- 통계 카드 (감지 횟수, 활동 시간, 임계값)
- 감지 로그 히스토리
- 부드러운 애니메이션 및 트랜지션

**5. iOS 네이티브 통합**
- 완전한 iOS 네이티브 모듈 구조
- CocoaPods 의존성 관리
- 마이크 권한 설정
- 백그라운드 오디오 모드 지원

### 🚧 제한 사항 및 개선 필요 사항

**1. 감지 정확도**
- 현재는 단순 RMS 임계값 기반 감지
- TensorFlow Lite ML 모델 통합 예정 (킥보드/차량 음향 패턴 학습)
- 오탐지 감소를 위한 필터링 로직 필요

**2. 오디오 재생**
- warning_beep.mp3 파일이 Xcode 프로젝트에 추가되어야 함
- 현재 일부 환경에서 오디오 재생 불안정

**3. 플랫폼 지원**
- 현재 iOS 전용
- Android 버전 개발 필요

**4. 배포**
- App Store 배포 준비 필요
- 코드 사이닝 및 프로비저닝 설정

### 📊 완성도 평가

- **코어 기능**: 80% (오디오 처리, 감지, 알림 완료)
- **UI/UX**: 90% (현대적인 디자인 구현)
- **네이티브 통합**: 95% (iOS 네이티브 모듈 완성)
- **ML/AI**: 0% (TensorFlow Lite 통합 예정)
- **플랫폼 지원**: 50% (iOS 완료, Android 미개발)
- **전체 MVP 완성도**: 75%

### 🎯 다음 단계

1. TensorFlow Lite 모델 통합 (킥보드/차량 음향 분류)
2. 감지 정확도 개선 (필터링 알고리즘)
3. Android 네이티브 모듈 개발
4. 사용자 설정 추가 (임계값 조절, 알림 방식 선택)
5. 배포 준비 (테스트, 코드 사이닝)

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
