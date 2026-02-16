import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ResourcesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Resources</Text>
      <Text style={styles.subtitle}>Useful links and information...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
});
