/**
 * Hook for managing mock/development mode
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_MODE_KEY = '@roadscan_mock_mode';
const MOCK_SCENARIO_KEY = '@roadscan_mock_scenario';

export function useMockMode() {
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockScenario, setMockScenario] = useState<string>('mixedConditions');
  const [loading, setLoading] = useState(true);

  // Load mock mode setting on mount
  useEffect(() => {
    loadMockMode();
  }, []);

  const loadMockMode = async () => {
    try {
      const [mode, scenario] = await Promise.all([
        AsyncStorage.getItem(MOCK_MODE_KEY),
        AsyncStorage.getItem(MOCK_SCENARIO_KEY),
      ]);
      
      setIsMockMode(mode === 'true');
      if (scenario) setMockScenario(scenario);
    } catch (error) {
      console.error('Failed to load mock mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMockMode = async () => {
    try {
      const newMode = !isMockMode;
      await AsyncStorage.setItem(MOCK_MODE_KEY, String(newMode));
      setIsMockMode(newMode);
      return newMode;
    } catch (error) {
      console.error('Failed to toggle mock mode:', error);
      return isMockMode;
    }
  };

  const setScenario = async (scenario: string) => {
    try {
      await AsyncStorage.setItem(MOCK_SCENARIO_KEY, scenario);
      setMockScenario(scenario);
    } catch (error) {
      console.error('Failed to set scenario:', error);
    }
  };

  return {
    isMockMode,
    mockScenario,
    loading,
    toggleMockMode,
    setScenario,
  };
}
