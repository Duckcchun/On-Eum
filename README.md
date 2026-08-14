# 🎧 온음 (On-Eum)

> 에어팟 노이즈 캔슬링 사용자를 위한 AI 위험음 감지 iOS 앱

에어팟으로 음악을 들으며 걷는 보행자에게 전동 킥보드, 오토바이, 차량의 접근 소리를 실시간으로 감지하여 **0.2초 이내에 햅틱 진동 + 경고음**으로 알려줍니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🎙️ 실시간 오디오 분석 | 마이크로 주변 소리를 0.1초 단위로 캡처하고 RMS 기반 분석 |
| 🛴 위험 유형 분류 | RMS 강도로 킥보드 / 오토바이 / 차량 자동 구분 |
| 📳 즉각 경고 | 강한 햅틱 진동 (3연타) + 오디오 덕킹 + 경고음 재생 |
| 📊 감지 통계 | 총 감지 횟수, 활동 시간, 안전 점수, 인사이트 분석 |
| 📋 감지 기록 | 날짜별 그룹핑, 위험등급 태그, CSV 내보내기 |
| 💾 데이터 영속성 | 앱 종료 후에도 로그와 통계 유지 (AsyncStorage) |
| 🧪 시뮬레이션 | 개발 테스트용 4가지 위험 유형 시뮬레이션 |

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React Native 0.73.4 (Bare Workflow, TypeScript) |
| 네이티브 | Swift + Objective-C 브릿징 (iOS) |
| 오디오 | AVFoundation (AVAudioEngine 실시간 캡처) |
| 저장소 | AsyncStorage (설정, 로그, 통계 영속성) |
| 로그 내보내기 | react-native-fs (CSV) |
| 예정 | TensorFlow Lite (ML 기반 소리 분류) |

---

## 📱 화면 구조

```
App.tsx
├── SplashScreen (레이더 애니메이션)
├── Onboarding (4슬라이드 소개)
└── MainApp (탭 네비게이션)
    ├── 🏠 홈 (HomeScreen)
    │   ├── 레이더 원형 애니메이션 (SAFE/DANGER)
    │   ├── 위험 감지 시 상세 카드 (ThreatDetailCard)
    │   ├── 상태 카드 (AirPods/청취/감지)
    │   ├── 최근 감지 로그
    │   └── 시뮬레이션 패널
    ├── 🕐 기록 (HistoryScreen)
    │   ├── 날짜별 그룹핑 로그
    │   ├── 위험등급 태그 (위험/주의)
    │   └── CSV 내보내기
    ├── 📊 통계 (StatsScreen)
    │   ├── 안전 점수/감지 횟수/활동 시간
    │   ├── 위험 유형 분석 (킥보드/오토바이)
    │   └── 인사이트 카드
    └── ⚙️ 설정 (SettingsScreen)
        ├── 감지 민감도 (높음/보통/낮음)
        ├── 알림 방식 (햅틱/오디오 토글)
        └── 일반 설정
```

---

## 🏗 프로젝트 구조

```
On-Eum/
├── App.tsx                          앱 진입점 + 탭 네비게이션
├── src/
│   ├── context/
│   │   └── AppContext.tsx           전역 상태 관리 (감지, 로그, 설정, 영속성)
│   ├── navigation/
│   │   └── TabBar.tsx               커스텀 하단 탭바 (애니메이션)
│   ├── screens/
│   │   ├── HomeScreen.tsx           메인 홈 화면
│   │   ├── HistoryScreen.tsx        감지 기록 화면
│   │   ├── StatsScreen.tsx          통계 분석 화면
│   │   ├── SettingsScreen.tsx       설정 화면
│   │   └── Onboarding.tsx           온보딩 화면
│   ├── native/
│   │   └── AudioBufferModule.ts     네이티브 브릿지 JS 래퍼
│   └── services/
│       ├── AlertService.ts          경고 트리거 (Haptic + Ducking)
│       └── ThreatDetector.ts        위협 판별 + 유형 분류 로직
└── ios/OnEum/
    ├── AudioBufferManager.swift     마이크 버퍼 수집 (AVAudioEngine)
    ├── AlertActionManager.swift     Haptic 진동 + Audio Ducking
    ├── AppDelegate.swift            앱 시작점
    └── Info.plist                   권한 설정 (마이크, 백그라운드 오디오)
```

---

## ⚡ 동작 흐름

```
사용자 보호 모드 ON
  → AudioBufferManager (Swift): AVAudioEngine 마이크 캡처 시작
    → 0.1초마다 RMS 계산 → JS로 이벤트 전송
  → ThreatDetector (JS): 오디오 분석
    → 5개 이동평균 필터링
    → 연속 3회 임계값 초과 감지
    → classifyThreat(): RMS 강도로 유형 분류
      → > 0.4: 차량
      → > 0.25: 오토바이
      → else: 킥보드
  → AlertService: 즉각 경고
    → 햅틱 3연타 진동
    → 오디오 덕킹 (음악 볼륨 ↓)
    → warning_beep.mp3 재생
    → 5초 후 자동 해제 / 수동 해제 가능
```

---

## 🚀 시작하기

### 요구 사항

- macOS (Ventura 이상)
- Xcode 15+
- Node.js 18+
- CocoaPods
- **실제 iPhone 기기** (시뮬레이터에서는 마이크/햅틱 불가)

### 설치 및 실행

```bash
# 클론
git clone https://github.com/Duckcchun/On-Eum.git
cd On-Eum

# 의존성 설치
npm install
cd ios && pod install && cd ..

# 실행 (실제 기기 연결 필요)
npx react-native run-ios --device
```

### Xcode로 실행

1. `ios/OnEum.xcworkspace` 열기
2. 실제 iPhone 연결
3. Signing → 본인 Apple ID 팀 선택
4. Build & Run

---

## 📊 완성도

| 영역 | 상태 | 비고 |
|------|------|------|
| 네이티브 오디오 처리 | ✅ 완료 | AVAudioEngine, RMS 계산 |
| 위협 감지 시스템 | ✅ 완료 | 이동평균 + 연속감지 + 유형분류 |
| 경고 알림 시스템 | ✅ 완료 | 햅틱 + 오디오 덕킹 + 경고음 |
| UI/UX | ✅ 완료 | 탭 네비게이션, 레이더, 카드 UI |
| 데이터 영속성 | ✅ 완료 | AsyncStorage (로그, 통계, 설정) |
| 시뮬레이션 | ✅ 완료 | 4가지 위험 유형 테스트 |
| ML 기반 분류 | 🚧 예정 | TensorFlow Lite 모델 통합 |
| 방향/거리 감지 | 🚧 예정 | 스테레오 마이크 활용 |
| Android | 🚧 예정 | 네이티브 모듈 개발 필요 |

---

## 📄 라이선스

MIT
