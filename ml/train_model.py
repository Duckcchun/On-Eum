#!/usr/bin/env python3
"""
온음 (On-Eum) - 소리 분류 모델 학습 스크립트

이 스크립트는 오디오 데이터를 Mel Spectrogram으로 변환하고,
CNN 모델을 학습시켜 .tflite 파일을 생성합니다.

사용법:
    python train_model.py --data_dir ./data --output_dir ./output

필요한 패키지:
    pip install tensorflow librosa numpy scikit-learn matplotlib

데이터 폴더 구조:
    data/
    ├── kickboard/    (전동 킥보드 소리 .wav 파일들)
    ├── motorcycle/   (오토바이 소리)
    ├── vehicle/      (차량 소리)
    ├── horn/         (경적 소리)
    ├── ambient/      (일반 환경음)
    └── speech/       (대화 소리)
"""

import os
import sys
import argparse
import numpy as np
from pathlib import Path

# ─── Configuration ───
CONFIG = {
    'sample_rate': 16000,       # 16kHz (모바일 최적)
    'duration': 1.0,            # 1초 클립
    'n_mels': 64,               # Mel 밴드 수
    'n_fft': 1024,              # FFT 윈도우 크기
    'hop_length': 256,          # 홉 길이
    'max_time_steps': 63,       # 시간 축 크기 (1초 @ 16kHz, hop=256)
    'batch_size': 32,
    'epochs': 50,
    'learning_rate': 0.001,
    'validation_split': 0.2,
    'test_split': 0.1,
}

# 클래스 라벨 (순서 중요!)
LABELS = ['kickboard', 'motorcycle', 'vehicle', 'horn', 'ambient', 'speech']


def load_audio(file_path, sr=16000, duration=1.0):
    """오디오 파일을 로드하고 정규화합니다."""
    import librosa
    
    try:
        # 파일 로드 (mono, 지정 sample rate)
        audio, _ = librosa.load(file_path, sr=sr, mono=True, duration=duration)
        
        # 길이 맞추기 (패딩 또는 트리밍)
        target_length = int(sr * duration)
        if len(audio) < target_length:
            # 짧으면 0으로 패딩
            audio = np.pad(audio, (0, target_length - len(audio)), mode='constant')
        else:
            # 길면 자르기
            audio = audio[:target_length]
        
        return audio
    except Exception as e:
        print(f"  ⚠️ 로드 실패: {file_path} - {e}")
        return None


def audio_to_mel_spectrogram(audio, sr=16000, n_mels=64, n_fft=1024, hop_length=256):
    """오디오를 Mel Spectrogram으로 변환합니다."""
    import librosa
    
    # Mel spectrogram 계산
    mel_spec = librosa.feature.melspectrogram(
        y=audio, sr=sr, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length
    )
    
    # dB 스케일로 변환
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # 정규화 [-1, 1]
    mel_spec_norm = (mel_spec_db - mel_spec_db.min()) / (mel_spec_db.max() - mel_spec_db.min() + 1e-8)
    mel_spec_norm = mel_spec_norm * 2 - 1
    
    return mel_spec_norm


def load_dataset(data_dir, labels=LABELS):
    """데이터셋을 로드하고 Mel Spectrogram으로 변환합니다."""
    X = []  # features
    y = []  # labels
    
    print("\n📂 데이터 로딩 중...")
    
    for label_idx, label in enumerate(labels):
        label_dir = os.path.join(data_dir, label)
        
        if not os.path.exists(label_dir):
            print(f"  ❌ 폴더 없음: {label_dir}")
            continue
        
        files = [f for f in os.listdir(label_dir) if f.endswith(('.wav', '.mp3', '.m4a', '.flac'))]
        print(f"  📁 {label}: {len(files)}개 파일")
        
        for file_name in files:
            file_path = os.path.join(label_dir, file_name)
            audio = load_audio(file_path, sr=CONFIG['sample_rate'], duration=CONFIG['duration'])
            
            if audio is not None:
                mel_spec = audio_to_mel_spectrogram(
                    audio,
                    sr=CONFIG['sample_rate'],
                    n_mels=CONFIG['n_mels'],
                    n_fft=CONFIG['n_fft'],
                    hop_length=CONFIG['hop_length']
                )
                X.append(mel_spec)
                y.append(label_idx)
    
    X = np.array(X)
    y = np.array(y)
    
    print(f"\n✅ 전체 데이터: {len(X)}개 샘플, {len(labels)}개 클래스")
    print(f"   입력 shape: {X.shape}")
    
    return X, y


def build_model(input_shape, num_classes):
    """CNN 모델을 생성합니다."""
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    
    model = keras.Sequential([
        # Input
        layers.Input(shape=input_shape),
        
        # CNN Block 1
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # CNN Block 2
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # CNN Block 3
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        # CNN Block 4
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),
        
        # Dense layers
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        
        # Output
        layers.Dense(num_classes, activation='softmax'),
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate']),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def train(data_dir, output_dir):
    """전체 학습 파이프라인을 실행합니다."""
    import tensorflow as tf
    from sklearn.model_selection import train_test_split
    
    print("=" * 60)
    print("🎧 온음 소리 분류 모델 학습")
    print("=" * 60)
    
    # 1. 데이터 로드
    X, y = load_dataset(data_dir)
    
    if len(X) == 0:
        print("\n❌ 데이터가 없습니다! data/ 폴더에 오디오 파일을 넣어주세요.")
        print("   필요한 구조:")
        for label in LABELS:
            print(f"     data/{label}/*.wav")
        sys.exit(1)
    
    # CNN 입력을 위해 채널 차원 추가 (N, H, W) → (N, H, W, 1)
    X = X[..., np.newaxis]
    
    # 2. 데이터 분할
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=CONFIG['test_split'], random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=CONFIG['validation_split'], random_state=42, stratify=y_train
    )
    
    print(f"\n📊 데이터 분할:")
    print(f"   Train: {len(X_train)}개")
    print(f"   Val:   {len(X_val)}개")
    print(f"   Test:  {len(X_test)}개")
    
    # 3. 모델 생성
    input_shape = X_train.shape[1:]  # (n_mels, time_steps, 1)
    model = build_model(input_shape, len(LABELS))
    model.summary()
    
    # 4. 학습
    print("\n🚀 학습 시작...")
    
    os.makedirs(output_dir, exist_ok=True)
    
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_accuracy', patience=10, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5, patience=5, min_lr=0.00001
        ),
        tf.keras.callbacks.ModelCheckpoint(
            os.path.join(output_dir, 'best_model.keras'),
            monitor='val_accuracy', save_best_only=True
        ),
    ]
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=CONFIG['epochs'],
        batch_size=CONFIG['batch_size'],
        callbacks=callbacks,
    )
    
    # 5. 평가
    print("\n📈 평가 결과:")
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"   Test Accuracy: {test_acc:.4f}")
    print(f"   Test Loss: {test_loss:.4f}")
    
    # 6. TFLite 변환
    print("\n🔄 TFLite 변환 중...")
    
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]  # 양자화 (모델 크기 축소)
    converter.target_spec.supported_types = [tf.float16]  # FP16 양자화
    
    tflite_model = converter.convert()
    
    tflite_path = os.path.join(output_dir, 'sound_classifier.tflite')
    with open(tflite_path, 'wb') as f:
        f.write(tflite_model)
    
    model_size_mb = os.path.getsize(tflite_path) / (1024 * 1024)
    print(f"   ✅ 모델 저장: {tflite_path} ({model_size_mb:.2f} MB)")
    
    # 7. 라벨 파일 생성
    labels_path = os.path.join(output_dir, 'sound_labels.txt')
    with open(labels_path, 'w') as f:
        f.write('\n'.join(LABELS))
    print(f"   ✅ 라벨 저장: {labels_path}")
    
    # 8. 학습 결과 요약
    print("\n" + "=" * 60)
    print("🎉 학습 완료!")
    print("=" * 60)
    print(f"\n📦 생성된 파일:")
    print(f"   • {tflite_path}")
    print(f"   • {labels_path}")
    print(f"\n📱 앱에 적용하기:")
    print(f"   1. '{tflite_path}' → ios/OnEum/ 폴더에 복사")
    print(f"   2. '{labels_path}' → ios/OnEum/ 폴더에 복사")
    print(f"   3. Xcode → Build Phases → Copy Bundle Resources에 추가")
    print(f"   4. 앱 빌드 → 자동으로 ML 분류 활성화!")
    
    return history, test_acc


def augment_audio(audio, sr=16000):
    """데이터 증강 (더 많은 학습 데이터 생성)"""
    import librosa
    
    augmented = []
    
    # 1. 시간 이동
    shift = np.random.randint(sr // 10)
    shifted = np.roll(audio, shift)
    augmented.append(shifted)
    
    # 2. 노이즈 추가
    noise = np.random.randn(len(audio)) * 0.005
    noisy = audio + noise
    augmented.append(noisy)
    
    # 3. 볼륨 변경
    gain = np.random.uniform(0.7, 1.3)
    louder = audio * gain
    augmented.append(np.clip(louder, -1.0, 1.0))
    
    # 4. 피치 변경 (±2 semitones)
    try:
        pitch_shift = np.random.choice([-2, -1, 1, 2])
        pitched = librosa.effects.pitch_shift(audio, sr=sr, n_steps=pitch_shift)
        augmented.append(pitched)
    except:
        pass
    
    return augmented


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='온음 소리 분류 모델 학습')
    parser.add_argument('--data_dir', type=str, default='./data',
                        help='학습 데이터 폴더 경로')
    parser.add_argument('--output_dir', type=str, default='./output',
                        help='모델 출력 폴더 경로')
    parser.add_argument('--epochs', type=int, default=50,
                        help='학습 에폭 수')
    parser.add_argument('--augment', action='store_true',
                        help='데이터 증강 사용')
    
    args = parser.parse_args()
    
    if args.epochs:
        CONFIG['epochs'] = args.epochs
    
    train(args.data_dir, args.output_dir)
