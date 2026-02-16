import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Colors } from '../../constants';

interface ResourceLink {
  title: string;
  description: string;
  url: string;
  category: string;
}

const resources: ResourceLink[] = [
  {
    title: 'U.S. Department of Transportation',
    description: 'Federal highway administration and road infrastructure information',
    url: 'https://www.transportation.gov/',
    category: 'Government',
  },
  {
    title: 'Federal Highway Administration (FHWA)',
    description: 'Highway standards, research, and policy information',
    url: 'https://highways.dot.gov/',
    category: 'Government',
  },
  {
    title: 'American Association of State Highway Officials',
    description: 'Standards for design, construction, and maintenance of highways',
    url: 'https://www.transportation.org/',
    category: 'Organizations',
  },
  {
    title: 'International Roughness Index (IRI)',
    description: 'Learn about the standard for measuring road roughness',
    url: 'https://www.fhwa.dot.gov/pavement/management/qm/data_qm_06.cfm',
    category: 'Standards',
  },
  {
    title: 'World Bank - Road Quality',
    description: 'Global road quality assessment guidelines and reports',
    url: 'https://www.worldbank.org/en/topic/transport/brief/road-safety',
    category: 'Research',
  },
  {
    title: 'Pavement Management Guide',
    description: 'FHWA guide on pavement management systems',
    url: 'https://www.fhwa.dot.gov/pavement/management/',
    category: 'Standards',
  },
];

export default function ResourcesScreen() {
  const handleLinkPress = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${title}`);
      console.error('Error opening URL:', error);
    }
  };

  // Group resources by category
  const categories = Array.from(new Set(resources.map((r) => r.category)));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resources</Text>
        <Text style={styles.subtitle}>
          Helpful links about road quality and infrastructure
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>About Road Quality</Text>
        <Text style={styles.infoText}>
          Road roughness is measured using the International Roughness Index (IRI). The
          IRI is expressed in meters per kilometer or inches per mile. Lower values
          indicate smoother roads.
        </Text>
        <Text style={styles.infoText}>
          • IRI {'<'} 2: Very smooth (airport runways)
          {'\n'}• IRI 2-4: Smooth (new highways)
          {'\n'}• IRI 4-8: Fair (older highways)
          {'\n'}• IRI 8-15: Poor (needs maintenance)
          {'\n'}• IRI {'>'} 15: Very poor (urgent repair needed)
        </Text>
      </View>

      {categories.map((category) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {resources
            .filter((resource) => resource.category === category)
            .map((resource, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resourceCard}
                onPress={() => handleLinkPress(resource.url, resource.title)}
              >
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceDescription}>{resource.description}</Text>
                <Text style={styles.resourceUrl}>🔗 {resource.url}</Text>
              </TouchableOpacity>
            ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap any link to open in your browser. These resources provide additional
          context about road quality standards and infrastructure management.
        </Text>
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
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  categorySection: {
    marginTop: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  resourceCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  resourceUrl: {
    fontSize: 12,
    color: Colors.primary,
  },
  footer: {
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
