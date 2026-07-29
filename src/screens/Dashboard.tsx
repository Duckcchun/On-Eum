import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated } from 'react-native';
import { triggerAlert } from '../services/AlertService';
import { startDetection, stopDetection } from '../services/ThreatDetector';

interface DangerLog {
  id: string;
  type: string;
  timestamp: string;
}

const Dashboard = () => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<DangerLog[]>([]);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const rmsThreshold = 0.15;

  useEffect(() => {
    if (isActive) {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [isActive]);

  const addLog = (type: string) => {
    const newLog: DangerLog = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toLocaleTimeString('ko-KR'),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    
    if (newState) {
      startDetection(addLog);
    } else {
      stopDetection();
    }
  };

  const simulateThreat = () => {
    addLog('킥보드 접근 감지');
    triggerAlert();
  };

  return (
    <View className={`flex-1 px-6 pt-10 ${isActive ? 'bg-red-950' : 'bg-gray-900'}`}>
      <Text className="text-white text-3xl font-bold text-center mb-2">온음</Text>
      <Text className="text-gray-400 text-sm text-center mb-2">
        에어팟 사용자를 위한 위험음 감지
      </Text>
      <Text className="text-gray-500 text-xs text-center mb-8">
        감지 임계값: RMS {rmsThreshold}
      </Text>

      <View className="items-center justify-center flex-1">
        <TouchableOpacity
          onPress={handleToggle}
          className={`w-48 h-48 rounded-full items-center justify-center ${
            isActive ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          <Text className="text-white text-2xl font-bold">
            {isActive ? 'ON' : 'OFF'}
          </Text>
          <Text className="text-white text-sm mt-1">안전 모드</Text>
        </TouchableOpacity>

        {isActive && (
          <Animated.Text
            style={{ opacity: blinkAnim }}
            className="text-red-400 text-lg font-semibold mt-6"
          >
            위험음 감지 중...
          </Animated.Text>
        )}

        {isActive && (
          <TouchableOpacity
            onPress={simulateThreat}
            className="mt-4 bg-yellow-600 px-6 py-2 rounded-lg"
          >
            <Text className="text-white font-bold">위협 시뮬레이션</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="h-64 mb-6">
        <Text className="text-white text-lg font-bold mb-3">최근 감지 로그</Text>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row justify-between py-2 border-b border-gray-700">
              <Text className="text-red-400 font-medium">{item.type}</Text>
              <Text className="text-gray-500">{item.timestamp}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-gray-600 text-center mt-4">감지 기록 없음</Text>
          }
        />
      </View>
    </View>
  );
};

export default Dashboard;
