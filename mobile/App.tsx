import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/Auth';
import OnboardingScreen from './src/screens/Onboarding';
import { supabase } from './src/services/supabase';
import { syncService } from './src/services/sync';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Initialize sync service
    syncService.init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      subscription.unsubscribe();
      syncService.stop();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Check onboarding status
      const onboardingComplete = await AsyncStorage.getItem('hasCompletedOnboarding');
      setHasCompletedOnboarding(onboardingComplete === 'true');

      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error initializing app:', error);
      setHasCompletedOnboarding(false);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Show onboarding on first launch
  if (!hasCompletedOnboarding) {
    return (
      <>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="auto" />
      </>
    );
  }

  // Allow users to skip authentication
  if (isAuthenticated === false) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
});
