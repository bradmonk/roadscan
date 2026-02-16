import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { apiService } from '../../services/api';
import { UserProfile } from '../../types';
import { Colors } from '../../constants';

export default function AccountScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    phone_model: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: null,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
        await loadProfile();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const userProfile = await apiService.getUserProfile();
      if (userProfile) {
        setProfile({
          phone_model: userProfile.phone_model || '',
          vehicle_make: userProfile.vehicle_make || '',
          vehicle_model: userProfile.vehicle_model || '',
          vehicle_year: userProfile.vehicle_year || null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      Alert.alert('Not Signed In', 'Please sign in to save your profile');
      return;
    }

    setSaving(true);
    try {
      // Convert null to undefined for API
      const updates = {
        phone_model: profile.phone_model,
        vehicle_make: profile.vehicle_make,
        vehicle_model: profile.vehicle_model,
        vehicle_year: profile.vehicle_year ?? undefined,
      };
      await apiService.updateUserProfile(updates);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setUserEmail('');
            setProfile({
              phone_model: '',
              vehicle_make: '',
              vehicle_model: '',
              vehicle_year: null,
            });
            Alert.alert('Success', 'Signed out successfully');
          } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Not Signed In</Text>
        <Text style={styles.emptySubtext}>
          Sign in from the home screen to save your profile and sync data across devices
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>{userEmail}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phone Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Model</Text>
          <TextInput
            style={styles.input}
            value={profile.phone_model || ''}
            onChangeText={(text) => setProfile({ ...profile, phone_model: text })}
            placeholder="e.g., iPhone 14 Pro"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Make</Text>
          <TextInput
            style={styles.input}
            value={profile.vehicle_make || ''}
            onChangeText={(text) => setProfile({ ...profile, vehicle_make: text })}
            placeholder="e.g., Toyota"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            value={profile.vehicle_model || ''}
            onChangeText={(text) => setProfile({ ...profile, vehicle_model: text })}
            placeholder="e.g., Camry"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={profile.vehicle_year?.toString() || ''}
            onChangeText={(text) =>
              setProfile({ ...profile, vehicle_year: text ? parseInt(text) : null })
            }
            placeholder="e.g., 2020"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Profile</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={[styles.buttonText, styles.signOutButtonText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signOutButtonText: {
    color: Colors.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
