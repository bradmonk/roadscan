import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const tiles = [
  { id: 'Scan', title: 'Scan', icon: 'scan' as const, color: '#eb5160' }, // lobster pink
  { id: 'History', title: 'History', icon: 'time-outline' as const, color: '#9ab8b2' }, // ash grey
  { id: 'Graphs', title: 'Graphs', icon: 'stats-chart' as const, color: '#071013' }, // ink black
  { id: 'Resources', title: 'Resources', icon: 'folder-open-outline' as const, color: '#dfd0c1' }, // almond cream
  { id: 'Help', title: 'Help', icon: 'help-circle-outline' as const, color: '#9ab8b2' }, // ash grey
  { id: 'Account', title: 'Account', icon: 'person-outline' as const, color: '#eb5160' }, // lobster pink
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
            <Ionicons name={tile.icon} size={48} color="#fff" style={styles.icon} />
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
    backgroundColor: '#dfe2e2', // alabaster grey
    padding: 20,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#071013', // ink black
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ab8b2', // ash grey
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
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
