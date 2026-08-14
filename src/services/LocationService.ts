/**
 * LocationService - GPS 위치 기록 서비스
 * 
 * 감지 발생 시 현재 위치를 기록하여 위험 지점 히트맵 데이터를 수집합니다.
 * 
 * 실제 동작을 위해서는:
 * - iOS: Info.plist에 NSLocationWhenInUseUsageDescription 추가 필요
 * - react-native-geolocation-service 또는 expo-location 패키지 설치
 * 
 * 현재는 네이티브 없이 구조만 제공합니다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

export interface DetectionLocation {
  id: string;
  location: LocationPoint;
  threatType: string;
  severity: 'danger' | 'warning' | 'info';
  date: string;
  address?: string; // 역지오코딩 주소 (선택)
}

export interface HotspotZone {
  center: LocationPoint;
  detectionCount: number;
  radius: number; // meters
  lastDetected: string;
  primaryThreatType: string;
}

const STORAGE_KEY = 'onEum_detectionLocations';
const MAX_STORED_LOCATIONS = 500;

let cachedLocations: DetectionLocation[] = [];

// ─── Load persisted locations ───
export const loadDetectionLocations = async (): Promise<DetectionLocation[]> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      cachedLocations = JSON.parse(saved);
    }
    return cachedLocations;
  } catch (error) {
    console.error('[LocationService] Failed to load locations:', error);
    return [];
  }
};

// ─── Save a detection location ───
export const saveDetectionLocation = async (
  threatType: string,
  severity: 'danger' | 'warning' | 'info',
  location?: LocationPoint
): Promise<DetectionLocation | null> => {
  try {
    // If no location provided, try to get current position
    const currentLocation = location || await getCurrentPosition();
    
    if (!currentLocation) {
      console.warn('[LocationService] No location available');
      return null;
    }

    const now = new Date();
    const detection: DetectionLocation = {
      id: Date.now().toString(),
      location: currentLocation,
      threatType,
      severity,
      date: now.toLocaleDateString('ko-KR'),
    };

    cachedLocations = [detection, ...cachedLocations].slice(0, MAX_STORED_LOCATIONS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedLocations));

    return detection;
  } catch (error) {
    console.error('[LocationService] Failed to save detection location:', error);
    return null;
  }
};

// ─── Get current position (placeholder) ───
const getCurrentPosition = async (): Promise<LocationPoint | null> => {
  // TODO: 실제 구현 시 react-native-geolocation-service 사용
  // 
  // import Geolocation from 'react-native-geolocation-service';
  // 
  // return new Promise((resolve) => {
  //   Geolocation.getCurrentPosition(
  //     (position) => {
  //       resolve({
  //         latitude: position.coords.latitude,
  //         longitude: position.coords.longitude,
  //         timestamp: new Date().toISOString(),
  //         accuracy: position.coords.accuracy,
  //       });
  //     },
  //     (error) => {
  //       console.warn('[LocationService] Geolocation error:', error);
  //       resolve(null);
  //     },
  //     { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
  //   );
  // });

  // Placeholder: return null (no location without native module)
  return null;
};

// ─── Calculate hotspot zones ───
export const calculateHotspots = (
  locations: DetectionLocation[],
  radiusMeters: number = 100
): HotspotZone[] => {
  if (locations.length === 0) return [];

  const hotspots: HotspotZone[] = [];
  const visited = new Set<string>();

  for (const detection of locations) {
    if (visited.has(detection.id)) continue;

    // Find all detections within radius
    const nearby = locations.filter(other => {
      if (visited.has(other.id)) return false;
      const distance = getDistanceMeters(
        detection.location.latitude,
        detection.location.longitude,
        other.location.latitude,
        other.location.longitude
      );
      return distance <= radiusMeters;
    });

    if (nearby.length >= 2) { // At least 2 detections to form a hotspot
      nearby.forEach(n => visited.add(n.id));

      // Calculate center
      const avgLat = nearby.reduce((sum, n) => sum + n.location.latitude, 0) / nearby.length;
      const avgLon = nearby.reduce((sum, n) => sum + n.location.longitude, 0) / nearby.length;

      // Find primary threat type
      const typeCounts: Record<string, number> = {};
      nearby.forEach(n => {
        typeCounts[n.threatType] = (typeCounts[n.threatType] || 0) + 1;
      });
      const primaryType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];

      hotspots.push({
        center: { latitude: avgLat, longitude: avgLon, timestamp: '' },
        detectionCount: nearby.length,
        radius: radiusMeters,
        lastDetected: nearby[0].date,
        primaryThreatType: primaryType,
      });
    }
  }

  return hotspots.sort((a, b) => b.detectionCount - a.detectionCount);
};

// ─── Haversine distance ───
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ─── Get statistics ───
export const getLocationStats = (locations: DetectionLocation[]) => {
  const totalPoints = locations.length;
  const uniqueDates = [...new Set(locations.map(l => l.date))];
  const dangerCount = locations.filter(l => l.severity === 'danger').length;
  const warningCount = locations.filter(l => l.severity === 'warning').length;
  
  // Group by date
  const byDate: Record<string, number> = {};
  locations.forEach(l => {
    byDate[l.date] = (byDate[l.date] || 0) + 1;
  });

  return {
    totalPoints,
    uniqueDays: uniqueDates.length,
    dangerCount,
    warningCount,
    byDate,
    avgPerDay: uniqueDates.length > 0 ? (totalPoints / uniqueDates.length).toFixed(1) : '0',
  };
};

// ─── Clear all location data ───
export const clearDetectionLocations = async () => {
  cachedLocations = [];
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export default {
  loadDetectionLocations,
  saveDetectionLocation,
  calculateHotspots,
  getLocationStats,
  clearDetectionLocations,
};
