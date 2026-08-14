# 개인정보 처리방침 / Privacy Policy

**최종 수정일: 2024년 12월**

---

## 한국어

### 1. 수집하는 정보

온음(On-Eum) 앱은 다음과 같은 정보를 처리합니다:

| 정보 유형 | 용도 | 저장 위치 |
|----------|------|----------|
| 마이크 오디오 | 위험음 실시간 분석 | 기기 내 (서버 전송 없음) |
| 위치 정보 (선택) | 위험 지점 기록 | 기기 내 (AsyncStorage) |
| 감지 로그 | 감지 이력 표시 | 기기 내 (AsyncStorage) |
| 앱 설정 | 사용자 환경 설정 | 기기 내 (AsyncStorage) |

### 2. 데이터 처리 원칙

- **음성 녹음을 저장하지 않습니다.** 마이크 입력은 실시간 분석 후 즉시 폐기됩니다.
- **서버로 데이터를 전송하지 않습니다.** 모든 처리는 기기 내에서 이루어집니다.
- **제3자와 데이터를 공유하지 않습니다.**
- **위치 정보는 선택적입니다.** 위치 권한을 거부해도 앱의 핵심 기능은 정상 동작합니다.

### 3. 마이크 접근

온음은 주변 위험 소리(전동 킥보드, 오토바이, 차량 등)를 감지하기 위해 마이크에 접근합니다.

- 오디오 데이터는 RMS(Root Mean Square) 값으로 변환되어 분석됩니다
- 원본 오디오는 저장되지 않으며 분석 즉시 메모리에서 삭제됩니다
- 백그라운드에서도 동일한 원칙이 적용됩니다

### 4. 위치 정보 (선택)

위치 기능을 활성화하면:
- 위험 감지 시 현재 위치가 기기 내에 기록됩니다
- 위험 지점 히트맵 표시에 사용됩니다
- 위치 데이터는 기기에서만 저장되며 외부로 전송되지 않습니다
- 설정에서 언제든지 비활성화하거나 데이터를 삭제할 수 있습니다

### 5. 데이터 보존 및 삭제

- 감지 로그: 최대 100건까지 기기에 저장 (초과 시 오래된 것부터 자동 삭제)
- 위치 기록: 최대 500건까지 기기에 저장
- 앱 삭제 시 모든 데이터가 완전히 삭제됩니다
- 앱 내 설정에서 수동 삭제 가능

### 6. 아동 보호

온음은 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.

### 7. 정책 변경

본 정책이 변경될 경우, 앱 업데이트를 통해 고지합니다.

### 8. 연락처

문의사항이 있으시면 아래로 연락해 주세요:
- 이메일: qasw1733@gmail.com
- GitHub: https://github.com/Duckcchun/On-Eum

---

## English

### 1. Information We Process

On-Eum processes the following information:

| Type | Purpose | Storage |
|------|---------|---------|
| Microphone Audio | Real-time danger sound analysis | On-device only (never sent to servers) |
| Location (optional) | Danger zone recording | On-device (AsyncStorage) |
| Detection Logs | Display detection history | On-device (AsyncStorage) |
| App Settings | User preferences | On-device (AsyncStorage) |

### 2. Data Processing Principles

- **We do NOT record or store audio.** Microphone input is analyzed in real-time and immediately discarded.
- **We do NOT send data to servers.** All processing happens entirely on your device.
- **We do NOT share data with third parties.**
- **Location is optional.** The core app functions work without location permission.

### 3. Microphone Access

On-Eum accesses the microphone to detect dangerous sounds (e-scooters, motorcycles, vehicles).

- Audio is converted to RMS (Root Mean Square) values for analysis
- Raw audio is never stored and is deleted from memory immediately after analysis
- The same principles apply in background mode

### 4. Location Information (Optional)

When location is enabled:
- Your position is recorded on-device when danger is detected
- Used to display a danger zone heatmap
- Location data is stored only on your device and never transmitted externally
- You can disable this or delete data at any time in settings

### 5. Data Retention & Deletion

- Detection logs: Up to 100 entries stored on device (oldest auto-deleted when exceeded)
- Location records: Up to 500 entries stored on device
- All data is completely deleted when you uninstall the app
- Manual deletion available in app settings

### 6. Children's Privacy

On-Eum does not intentionally collect personal information from children under 14.

### 7. Policy Changes

Changes to this policy will be communicated through app updates.

### 8. Contact

For questions, please contact:
- Email: qasw1733@gmail.com
- GitHub: https://github.com/Duckcchun/On-Eum
