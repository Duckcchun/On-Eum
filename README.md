# 🎧 온음 (On-Eum)

> **에어팟 노이즈 캔슬링 사용자를 위한 AI 위험음 감지 iOS 앱**

에어팟으로 음악을 들으며 걷는 보행자에게 전동 킥보드, 오토바이, 차량의 접근 소리를 실시간으로 감지하여 **0.2초 이내에 햅틱 진동 + 경고음**으로 알려줍니다.

[![iOS](https://img.shields.io/badge/iOS-15.0+-000000?style=flat&logo=apple&logoColor=white)](https://developer.apple.com/ios/)
[![React Native](https://img.shields.io/badge/React_Native-0.73.4-61DAFB?style=flat&logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Swift](https://img.shields.io/badge/Swift-5.9-F05138?style=flat&logo=swift&logoColor=white)](https://swift.org/)

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🎙️ **실시간 오디오 분석** | 마이크로 주변 소리를 0.1초 단위로 캡처하고 RMS 기반 분석 |
| 🛴 **위험 유형 분류** | RMS 강도 + ML 모델(TFLite)로 킥보드 / 오토바이 / 차량 자동 구분 |
| 📳 **즉각 경고** | 강한 햅틱 진동 (3단계 패턴) + 오디오 덕킹 + 경고음 재생 |
| 🧭 **방향 감지** | 스테레오 마이크 L/R 분석으로 위험 방향 (좌/우) 추정 |
| 🎧 **AirPods 감지** | 블루투스 기기 연결/해제 실시간 감시 + 자동 인식 |
| 🔄 **백그라운드 실행** | 화면 꺼져도 오디오 엔진 유지 + 인터럽트 자동 복구 |
| 🔋 **적응형 감지** | 배경: 0.3초 간격(절약) → 소리 감지: 0.1초(정확) 자동 전환 |
| 📊 **감지 통계** | 총 감지 횟수, 활동 시간, 안전 점수, 인사이트 분석 |
| 📋 **감지 기록** | 날짜별 그룹핑, 위험등급 태그, CSV 내보내기 |
| 📍 **위험 지도** | GPS 위치 기반 감지 히트맵 + 위험 지점 집계 |
| 💾 **데이터 영속성** | 앱 종료 후에도 로그와 통계 유지 (AsyncStorage) |
| 🧪 **시뮬레이션** | 개발 테스트용 4가지 위험 유형 시뮬레이션 |
| ❌ **오탐 피드백** | "오탐이에요" 버튼 → 로그 마킹 → ML 개선 데이터 수집 |
| 🌐 **다국어** | 한국어 / English 지원 (기기 언어 자동 감지) |
| 🔊 **알림 커스텀** | 경고음 볼륨 4단계 + 진동 패턴 3종 선택 |

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React Native 0.73.4 (Bare Workflow, TypeScript) |
| 네이티브 | Swift 5.9 + Objective-C 브릿징 (iOS) |
| 오디오 | AVFoundation (AVAudioEngine 실시간 캡처) |
| ML (예정) | TensorFlow Lite (소리 분류 모델) |
| 저장소 | AsyncStorage (설정, 로그, 통계, 위치 영속성) |
| 로그 내보내기 | react-native-fs (CSV) |
| 위치 (예정) | react-native-geolocation-service |
| 지도 (예정) | react-native-maps |

---

## 📱 화면 구조

```
App.tsx
├── SplashScreen (레이더 애니메이션)
├── Onboarding (4슬라이드 소개)
├── PermissionScreen (마이크 권한 요청)
└── MainApp (5탭 네비게이션)
    ├── 🏠 홈 (HomeScreen)
    │   ├── 레이더 원형 애니메이션 (SAFE/DANGER)
    │   ├── 위험 감지 시 상세 카드 + 방향 표시
    │   ├── 상태 카드 (AirPods/청취/감지)
    │   ├── 최근 감지 로그
    │   └── 시뮬레이션 패널
    ├── 🕐 기록 (HistoryScreen)
    │   ├── 날짜별 그룹핑 로그
    │   ├── 위험등급 태그 (위험/주의)
    │   └── CSV 내보내기
    ├── 📍 지도 (MapScreen)
    │   ├── 위험 지점 히트맵
    │   ├── 위치별 감지 기록
    │   └── 위치 통계
    ├── 📊 통계 (StatsScreen)
    │   ├── 안전 점수/감지 횟수/활동 시간
    │   ├── 위험 유형 분석 (킥보드/오토바이)
    │   └── 인사이트 카드
    └── ⚙️ 설정 (SettingsScreen)
        ├── 감지 민감도 (높음/보통/낮음)
        ├── 알림 볼륨/패턴 설정
        ├── 알림 방식 (햅틱/오디오 토글)
        └── 일반 설정
```

---

## 🏗 프로젝트 구조

```
On-Eum/
├── App.tsx                          앱 진입점 + 탭 네비게이션 + 권한 게이트
├── app.json                         앱 메타데이터
├── PRIVACY_POLICY.md                개인정보 처리방침 (한/영)
├── src/
│   ├── context/
│   │   └── AppContext.tsx           전역 상태 관리 + 영속성 + AirPods 연동
│   ├── i18n/
│   │   ├── index.ts                 다국어 시스템 (Provider + useTranslation)
│   │   ├── ko.ts                    한국어 번역
│   │   └── en.ts                    영어 번역
│   ├── navigation/
│   │   └── TabBar.tsx               커스텀 하단 탭바 (5탭, 애니메이션)
│   ├── screens/
│   │   ├── HomeScreen.tsx           메인 홈 (레이더 + 감지 + 시뮬레이션)
│   │   ├── HistoryScreen.tsx        감지 기록 (그룹핑 + CSV)
│   │   ├── MapScreen.tsx            위험 지도 (히트맵 + 통계)
│   │   ├── StatsScreen.tsx          통계 분석 (점수 + 인사이트)
│   │   ├── SettingsScreen.tsx       설정 (민감도 + 볼륨 + 패턴)
│   │   ├── PermissionScreen.tsx     마이크 권한 요청
│   │   └── Onboarding.tsx           온보딩 화면
│   ├── native/
│   │   ├── AudioBufferModule.ts     오디오 버퍼 브릿지 (적응형 모드)
│   │   ├── AudioRouteModule.ts      AirPods/블루투스 라우트 브릿지
│   │   └── SoundClassifierModule.ts ML 소리 분류 브릿지
│   └── services/
│       ├── AlertService.ts          경고 (Haptic + Ducking + 볼륨/패턴)
│       ├── ThreatDetector.ts        위협 판별 + ML 연동 + 방향 추적
│       └── LocationService.ts       GPS 위치 기록 + 히트맵 계산
└── ios/OnEum/
    ├── AudioBufferManager.swift     마이크 캡처 + 적응형 + 백그라운드 + 방향
    ├── AlertActionManager.swift     Haptic (3패턴) + Audio Ducking + 볼륨
    ├── AudioRouteManager.swift      AirPods 연결 감지 + 마이크 권한
    ├── SoundClassifier.swift        TFLite 모델 추론 + RMS fallback
    ├── AppDelegate.swift            앱 시작점
    ├── Info.plist                   권한 (마이크/위치/블루투스/백그라운드)
    └── PrivacyInfo.xcprivacy        Apple 프라이버시 매니페스트
```

---

## ⚡ 동작 흐름

```
사용자 보호 모드 ON
  → PermissionGate: 마이크 권한 확인
  → AudioBufferManager (Swift): AVAudioEngine 마이크 캡처
    → 적응형: 평상시 0.3초 / 소리 감지 시 0.1초
    → 스테레오 L/R 분리 → direction (-1~+1) 계산
    → 백그라운드 유지 + 인터럽트 자동 복구
  → ThreatDetector (JS): 오디오 분석
    → 5개 이동평균 필터링 + 연속 3회 임계값 초과
    → SoundClassifier (ML): 소리 유형 분류 (우선)
    → classifyThreat (RMS): 강도 기반 분류 (fallback)
  → AlertService: 즉각 경고
    → 햅틱 (soft/medium/strong 패턴)
    → 오디오 덕킹 + warning_beep.mp3 (볼륨 조절)
    → 5초 후 자동 해제 / 수동 해제 / 오탐 마킹
  → LocationService: GPS 위치 기록 (선택)
  → AppContext: 로그 저장 + 통계 업데이트 + AsyncStorage 영속성
```

---

## 🚀 시작하기

### 요구 사항

| 항목 | 버전 |
|------|------|
| macOS | Ventura 이상 |
| Xcode | 15+ |
| Node.js | 18+ |
| CocoaPods | 최신 |
| 기기 | **실제 iPhone** (시뮬레이터 불가: 마이크/햅틱) |

### 설치

```bash
# 1. 클론
git clone https://github.com/Duckcchun/On-Eum.git
cd On-Eum

# 2. JS 의존성 설치
npm install

# 3. iOS Pod 설치
cd ios && pod install && cd ..

# 4. (선택) TFLite ML 모델 사용 시
#    ios/Podfile에서 TensorFlowLiteSwift 주석 해제 후:
#    cd ios && pod install && cd ..
```

### 실행

```bash
# Metro 번들러 시작
npx react-native start

# 실제 기기로 실행 (별도 터미널)
npx react-native run-ios --device
```

### Xcode로 실행

1. `ios/OnEum.xcworkspace` 열기
2. 실제 iPhone USB 연결
3. Signing & Capabilities → 본인 Apple ID 팀 선택
4. ▶️ Build & Run

---

## 🧪 ML 모델 적용하기

TensorFlow Lite 소리 분류 모델을 적용하려면:

```bash
# 1. Podfile에서 TFLite 주석 해제
# pod 'TensorFlowLiteSwift', '~> 2.14'  →  주석 해제

# 2. Pod 설치
cd ios && pod install && cd ..

# 3. 모델 파일 추가 (Xcode)
# - sound_classifier.tflite  →  ios/OnEum/ 에 추가
# - sound_labels.txt          →  ios/OnEum/ 에 추가
# - Build Phases → Copy Bundle Resources에 두 파일 추가

# 4. SoundClassifier.swift에서 TODO 주석 해제
```

### 라벨 파일 형식 (sound_labels.txt)
```
kickboard
motorcycle
vehicle
horn
ambient
speech
```

---

## 📊 완성도

| 영역 | 상태 | 비고 |
|------|------|------|
| 네이티브 오디오 처리 | ✅ 완료 | AVAudioEngine + 적응형 + 백그라운드 |
| 위협 감지 시스템 | ✅ 완료 | 이동평균 + 연속감지 + 유형분류 + 방향 |
| 경고 알림 시스템 | ✅ 완료 | 햅틱 3패턴 + 오디오 덕킹 + 볼륨조절 |
| AirPods 연결 감지 | ✅ 완료 | 실시간 블루투스 라우트 감시 |
| 백그라운드 실행 | ✅ 완료 | 인터럽트 복구 + 미디어 리셋 대응 |
| 배터리 최적화 | ✅ 완료 | 적응형 버퍼 (0.3s ↔ 0.1s) |
| UI/UX | ✅ 완료 | 5탭 네비게이션 + 레이더 + 카드 UI |
| 데이터 영속성 | ✅ 완료 | AsyncStorage (로그, 통계, 설정, 위치) |
| 마이크 권한 UX | ✅ 완료 | PermissionScreen + PermissionGate |
| 오탐 피드백 | ✅ 완료 | 로그 마킹 → ML 개선 데이터 |
| 알림 커스터마이징 | ✅ 완료 | 볼륨 4단계 + 패턴 3종 |
| 위험 지도 | ✅ 완료 | 히트맵 계산 + 위치 통계 (UI 준비) |
| 다국어 (i18n) | ✅ 완료 | 한국어/영어 (기기 언어 자동 감지) |
| 프라이버시 정책 | ✅ 완료 | 한/영 문서 (PRIVACY_POLICY.md) |
| ML 기반 분류 | 🟡 인프라 완료 | .tflite 모델 파일만 추가하면 동작 |
| 지도 표시 | 🟡 인프라 완료 | react-native-maps 설치 후 동작 |
| GPS 위치 기록 | 🟡 인프라 완료 | react-native-geolocation-service 설치 후 동작 |
| Apple Watch | ❌ 미구현 | WatchKit 별도 개발 필요 |
| 위젯 | ❌ 미구현 | WidgetKit 별도 개발 필요 |

---

## 🔐 프라이버시

- **음성 녹음 저장 안 함** — 실시간 분석 후 즉시 폐기
- **서버 전송 없음** — 모든 처리 기기 내 로컬
- **위치 선택적** — 핵심 기능은 위치 없이도 동작
- 상세: [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)

---

## 📄 라이선스

MIT License © 2024 Duckcchun
