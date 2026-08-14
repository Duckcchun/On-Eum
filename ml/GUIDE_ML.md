# 🧠 온음 ML 모델 학습 가이드

> 킥보드, 오토바이, 차량, 경적 소리를 구분하는 AI 모델을 직접 학습시키는 방법

---

## 📋 전체 흐름

```
[1단계] 환경 세팅 (10분)
    ↓
[2단계] 데이터 수집 (1~2주)
    ↓
[3단계] 모델 학습 (30분~2시간)
    ↓
[4단계] 앱에 적용 (5분)
    ↓
[5단계] 테스트 & 개선 (반복)
```

---

## 1단계: 환경 세팅

### Python 환경 준비

```bash
# Python 3.9+ 필요
python --version

# 가상 환경 생성 (권장)
python -m venv oneum_ml
source oneum_ml/bin/activate  # macOS/Linux
# oneum_ml\Scripts\activate   # Windows

# 패키지 설치
cd ml/
pip install -r requirements.txt
```

### 필요한 패키지
- `tensorflow` - 모델 학습 + TFLite 변환
- `librosa` - 오디오 파일 로드 + Mel Spectrogram 변환
- `numpy` - 수치 연산
- `scikit-learn` - 데이터 분할
- `matplotlib` - 시각화 (선택)

---

## 2단계: 데이터 수집 ⭐ (가장 중요!)

### 폴더 구조

```
ml/data/
├── kickboard/       ← 전동 킥보드 소리
│   ├── kick_001.wav
│   ├── kick_002.wav
│   └── ... (최소 100개, 이상 500개+)
├── motorcycle/      ← 오토바이 소리
│   ├── moto_001.wav
│   └── ...
├── vehicle/         ← 차량 소리 (승용차, 버스 등)
│   ├── car_001.wav
│   └── ...
├── horn/            ← 경적/클락션 소리
│   ├── horn_001.wav
│   └── ...
├── ambient/         ← 일반 환경음 (바람, 카페, 공원 등)
│   ├── amb_001.wav
│   └── ... (200개+ 권장)
└── speech/          ← 사람 대화 소리 (오탐 방지!)
    ├── speech_001.wav
    └── ... (100개+)
```

### 수집 방법

#### 방법 1: 직접 녹음 (가장 정확 ✅)

| 팁 | 설명 |
|-----|------|
| 앱 | iPhone "음성 메모" 또는 무료 녹음 앱 사용 |
| 길이 | 각 3~10초 녹음 → 나중에 1초씩 잘라짐 |
| 환경 | 다양한 장소에서! (골목, 대로, 공원, 교차로) |
| 거리 | 가까운 것 + 먼 것 둘 다 |
| 날씨 | 맑은 날 + 바람 부는 날 + 비 오는 날 |

**킥보드 소리 녹음 팁:**
- 킥보드 대여소 앞에서 출발/정지하는 소리
- 도보 중 지나가는 킥보드 (다양한 속도)
- 전동 모터 특유의 "윙~" 소리에 집중

**ambient 수집 (매우 중요!):**
- 조용한 공원, 시끄러운 카페, 바람 소리
- 이게 부족하면 **모든 소리에 반응하는 앱**이 됨!

#### 방법 2: 오픈 데이터셋 활용

| 데이터셋 | URL | 용도 |
|----------|-----|------|
| ESC-50 | github.com/karolpiczak/ESC-50 | 환경음 50종 |
| UrbanSound8K | urbansounddataset.weebly.com | 도시 소음 분류 |
| AudioSet | research.google.com/audioset | Google 대규모 오디오 |
| FSD50K | zenodo.org/record/4060432 | Freesound 데이터 |

**ESC-50에서 유용한 클래스:**
- `car_horn` → horn/
- `engine` → vehicle/
- `siren` → vehicle/
- `rain`, `wind`, `footsteps` → ambient/

#### 방법 3: YouTube에서 추출

```bash
# yt-dlp 설치
pip install yt-dlp

# 오디오만 다운로드
yt-dlp -x --audio-format wav "https://youtube.com/watch?v=..." -o "data/kickboard/yt_%(id)s.wav"
```

**검색 키워드:**
- "전동 킥보드 주행 소리", "electric scooter sound"
- "오토바이 엔진음", "motorcycle engine sound"
- "도로 차량 소음", "traffic noise"
- "자동차 경적", "car horn compilation"

### 데이터 전처리 도움 스크립트

```python
# 긴 파일을 1초 클립으로 자르기
from pydub import AudioSegment
import os

def split_audio(input_file, output_dir, clip_duration_ms=1000):
    """긴 오디오를 1초 클립으로 분할"""
    audio = AudioSegment.from_file(input_file)
    os.makedirs(output_dir, exist_ok=True)
    
    for i, start in enumerate(range(0, len(audio) - clip_duration_ms, clip_duration_ms)):
        clip = audio[start:start + clip_duration_ms]
        clip.export(f"{output_dir}/clip_{i:04d}.wav", format="wav")
    
    print(f"✅ {i+1}개 클립 생성됨 → {output_dir}")

# 사용 예:
# split_audio("raw/long_kickboard.mp3", "data/kickboard/")
```

### 데이터 품질 체크리스트

- [ ] 각 클래스 최소 100개 파일 있음
- [ ] `ambient` 클래스가 가장 많음 (200개+)
- [ ] 다양한 환경에서 녹음됨 (실내/실외, 조용/시끄러운)
- [ ] 다양한 거리에서 녹음됨 (가까이/멀리)
- [ ] `speech`에 다양한 대화 포함 (남/여, 1명/여러명)
- [ ] 파일이 모두 재생 가능한지 확인

---

## 3단계: 모델 학습

### 기본 학습

```bash
cd ml/

# 기본 학습 (50 에폭)
python train_model.py --data_dir ./data --output_dir ./output

# 에폭 조절
python train_model.py --data_dir ./data --output_dir ./output --epochs 100
```

### 학습 결과 확인

```
📊 데이터 분할:
   Train: 800개
   Val:   200개
   Test:  100개

📈 평가 결과:
   Test Accuracy: 0.8700  ← 87% 정확도
   Test Loss: 0.4521

📦 생성된 파일:
   • ./output/sound_classifier.tflite (2.1 MB)
   • ./output/sound_labels.txt
```

### 목표 정확도

| 정확도 | 평가 | 다음 단계 |
|--------|------|----------|
| < 70% | ❌ 부족 | 데이터 더 수집 필요 |
| 70~80% | 🟡 사용 가능 | 데이터 증강 시도 |
| 80~90% | 🟢 양호 | 실기기 테스트 |
| > 90% | ✅ 우수 | 배포 가능! |

### 정확도가 낮을 때 해결법

1. **데이터 부족** → 각 클래스 300개 이상으로 늘리기
2. **데이터 불균형** → ambient를 다른 클래스의 2배로
3. **데이터 증강 사용** → `--augment` 플래그 추가
4. **에폭 늘리기** → `--epochs 100`
5. **오분류 분석** → confusion matrix 확인하고 문제 클래스 보강

---

## 4단계: 앱에 적용 (5분)

```bash
# 1. 모델 파일 복사
cp ml/output/sound_classifier.tflite ios/OnEum/
cp ml/output/sound_labels.txt ios/OnEum/

# 2. Podfile에서 TFLite 주석 해제
# ios/Podfile 열고:
# pod 'TensorFlowLiteSwift', '~> 2.14'  ← 주석 해제

# 3. Pod 설치
cd ios && pod install && cd ..

# 4. Xcode에서:
# - sound_classifier.tflite → OnEum 그룹에 드래그
# - sound_labels.txt → OnEum 그룹에 드래그
# - "Copy items if needed" 체크
# - Target: OnEum 체크
# - Build Phases → Copy Bundle Resources에 두 파일 확인

# 5. SoundClassifier.swift에서 TODO 주석 해제 (TFLite Interpreter 코드)

# 6. 빌드!
npx react-native run-ios --device
```

### 적용 확인

앱에서 시뮬레이션 패널로 테스트:
- 🛴 킥보드 시뮬레이션 → 콘솔에 `[SoundClassifier] method: tflite` 출력 확인

---

## 5단계: 테스트 & 개선 (반복)

### 실기기 테스트

1. 앱 설치 후 보호 모드 ON
2. 실제 도로에서 30분 사용
3. **오탐 횟수 기록** (대화소리, 바람에 잘못 울린 횟수)
4. **미탐 횟수 기록** (킥보드 지나갔는데 안 울린 횟수)

### 오탐이 많을 때

→ `ambient`와 `speech` 데이터를 더 추가

### 미탐이 많을 때

→ 해당 위험 유형 데이터를 더 추가 + 더 먼 거리에서 녹음

### 오탐 데이터 활용

앱에서 "오탐이에요" 버튼을 누른 로그를 활용:
1. 앱 로그에서 오탐 시점의 RMS/centroid 값 확인
2. 비슷한 환경음을 `ambient`에 추가
3. 모델 재학습

---

## 🔧 고급: 모델 개선 팁

### 1. Transfer Learning (전이 학습)

사전 학습된 모델(YAMNet)을 기반으로 Fine-tuning:

```python
import tensorflow_hub as hub

# YAMNet 기반 모델 (Google 오디오 분류 모델)
yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')

# YAMNet의 embedding을 추출하여 우리 분류기에 사용
# → 적은 데이터로도 높은 정확도 달성 가능
```

### 2. 실시간 성능 최적화

- **INT8 양자화**: 모델 크기 1/4로 축소 (정확도 약간 감소)
- **모델 프루닝**: 불필요한 뉴런 제거
- **입력 크기 축소**: n_mels=32로 줄이면 2배 빨라짐

### 3. Edge TPU / CoreML 변환

```python
# CoreML 변환 (iOS 네이티브 사용 시 더 빠름)
import coremltools as ct
coreml_model = ct.convert(keras_model)
coreml_model.save("SoundClassifier.mlmodel")
```

---

## ❓ FAQ

**Q: 데이터 얼마나 모아야 해요?**
A: 최소 각 클래스 100개. 이상적으로 500개+. ambient는 1000개+ 추천.

**Q: 어떤 포맷이 좋아요?**
A: WAV (16bit, 16kHz, mono)가 가장 좋음. MP3도 가능하지만 품질 손실 있음.

**Q: GPU 없어도 되나요?**
A: 네! 데이터가 적으면 CPU로도 30분 내 학습 가능. 많으면 Google Colab(무료 GPU) 사용.

**Q: Google Colab에서 학습하려면?**
A: 
1. colab.research.google.com 접속
2. 새 노트북 생성
3. 런타임 → GPU로 변경
4. `ml/` 폴더를 Google Drive에 업로드
5. 노트북에서 `!pip install -r requirements.txt` + `!python train_model.py`

**Q: 모델 정확도가 50%밖에 안 나와요**
A: 데이터가 부족하거나 불균형. ambient를 더 추가하고, 각 클래스 수를 비슷하게 맞춰보세요.

**Q: 킥보드와 자전거를 구분할 수 있나요?**
A: 전동 킥보드는 모터 소리가 있어서 구분 가능. 일반 자전거는 거의 소리가 없어서 감지 대상이 아님.

---

## 📚 참고 자료

- [TensorFlow Audio Classification 튜토리얼](https://www.tensorflow.org/tutorials/audio/simple_audio)
- [Librosa 공식 문서](https://librosa.org/doc/latest/)
- [YAMNet 모델](https://tfhub.dev/google/yamnet/1)
- [ESC-50 데이터셋](https://github.com/karolpiczak/ESC-50)
- [TFLite 모바일 배포 가이드](https://www.tensorflow.org/lite/guide)
