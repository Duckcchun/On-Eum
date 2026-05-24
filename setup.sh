#!/bin/bash

set -e

echo "============================================"
echo "  온음(On-Eum) MVP 셋업 스크립트"
echo "============================================"
echo ""

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ $1 이 설치되어 있지 않습니다. 먼저 설치해주세요."
    exit 1
  fi
}

echo "🔍 필수 도구 확인 중..."
check_command node
check_command npm
check_command pod
check_command xcodebuild

echo "✅ 모든 필수 도구가 설치되어 있습니다."
echo ""

echo "📦 npm 패키지 설치 중..."
npm install
echo ""

echo "🍎 CocoaPods 설치 중..."
cd ios
pod install
cd ..
echo ""

echo "🔊 warning_beep.mp3 확인..."
if [ ! -f "ios/OnEum/warning_beep.mp3" ]; then
  echo "⚠️  ios/OnEum/warning_beep.mp3 파일이 없습니다."
  echo "   경고음 파일을 해당 경로에 직접 추가해주세요."
  echo "   (짧은 비프음 mp3 파일이면 됩니다)"
  echo ""
fi

echo "============================================"
echo "  ✅ 셋업 완료!"
echo "============================================"
echo ""
echo "실행 방법:"
echo ""
echo "  방법 1) 터미널에서 실행:"
echo "    npx react-native run-ios --device"
echo ""
echo "  방법 2) Xcode에서 실행:"
echo "    1. ios/OnEum.xcworkspace 를 Xcode로 열기"
echo "    2. 실제 iPhone 기기 연결"
echo "    3. Signing & Capabilities에서 팀 선택"
echo "    4. ▶️ 빌드 & 실행"
echo ""
echo "⚠️  주의사항:"
echo "  - 시뮬레이터에서는 마이크/햅틱이 동작하지 않습니다."
echo "  - 반드시 실제 iPhone 기기에서 테스트하세요."
echo "  - Apple Developer 계정이 필요합니다 (무료 계정 가능)."
echo ""
