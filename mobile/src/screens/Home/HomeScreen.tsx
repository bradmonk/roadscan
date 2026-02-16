import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const tiles = [
  { id: 'Scan', title: 'Scan', icon: '📡', color: '#3b82f6' },
  { id: 'History', title: 'History', icon: '📜', color: '#8b5cf6' },
  { id: 'Graphs', title: 'Graphs', icon: '📊', color: '#10b981' },
  { id: 'Resources', title: 'Resources', icon: '🔗', color: '#f59e0b' },
  { id: 'Help', title: 'Help', icon: '❓', color: '#ef4444' },
  { id: 'Account', title: 'Account', icon: '👤', color: '#6366f1' },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.welcome}>Welcome to RoadScan</Text>
      <Text style={styles.subtitle}>Track road roughness with your phone</Text>
      
      <View style={styles.gridContainer}>
        {tiles.map((tile) => (
          <TouchableOpacity
            key={tile.id}
            style={[styles.tile, { backgroundColor: tile.color }]}
            onPress={() => navigation.navigate(tile.id as keyof RootStackParamList)}
          >
            <Text style={styles.icon}>{tile.icon}</Text>
            <Text style={styles.tileTitle}>{tile.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
