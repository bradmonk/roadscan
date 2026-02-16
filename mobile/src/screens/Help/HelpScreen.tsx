import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I start a road scan?',
    answer:
      'Tap the Scan tile from the home screen. Once on the scan screen, press the Start button. Make sure to allow location permissions when prompted. For best results, mount your phone securely in your vehicle.',
  },
  {
    question: 'Do I need an internet connection to use the app?',
    answer:
      'No! RoadScan works fully offline. All scan data is saved locally on your device. If you sign in, your data will automatically sync to the cloud when you have an internet connection.',
  },
  {
    question: 'How accurate are the measurements?',
    answer:
      'Accuracy depends on your phone\'s sensors and mounting position. For best results: mount your phone securely, avoid excessive phone movement, drive at normal speeds, and ensure your phone is level.',
  },
  {
    question: 'What do the colors on the map mean?',
    answer:
      'Green segments indicate smooth roads (excellent condition), lime/yellow shows fair roads, orange indicates rough roads, and red shows very rough roads that may need maintenance.',
  },
  {
    question: 'Can I delete old scans?',
    answer:
      'Yes! Go to the History screen, find the scan you want to delete, and tap the Delete button. You\'ll be asked to confirm before the scan is permanently removed.',
  },
  {
    question: 'Why should I create an account?',
    answer:
      'Creating an account is optional. It allows you to sync your data across devices and back up your scans to the cloud. You can use the app completely offline without an account.',
  },
  {
    question: 'How is road roughness calculated?',
    answer:
      'The app uses your phone\'s accelerometer and gyroscope to measure vibrations while driving. These are processed using a Root Mean Square (RMS) algorithm and normalized to a 0-100 scale, where higher values indicate rougher roads.',
  },
  {
    question: 'Does the app drain my battery?',
    answer:
      'The app uses GPS and sensors during active scans, which does consume battery. For long trips, we recommend keeping your phone plugged in to a charger.',
  },
  {
    question: 'Can I use this while walking or cycling?',
    answer:
      'The app is optimized for vehicle use. Walking or cycling speeds may produce less accurate results, but you can still use it to get a general sense of path quality.',
  },
  {
    question: 'What should I do with my vehicle information?',
    answer:
      'In the Account screen, you can enter your vehicle make, model, and year. This helps us understand how different vehicles might produce different roughness readings for the same road.',
  },
];

const tips = [
  'Mount your phone securely to avoid sensor interference',
  'Keep your phone level for best accuracy',
  'Drive at normal, steady speeds during scans',
  'Allow location permissions for GPS tracking',
  'Pause scanning at red lights to save accurate data',
  'Sign in to back up your data to the cloud',
  'Check the Graphs screen to see your driving patterns',
];

export default function HelpScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & FAQ</Text>
        <Text style={styles.subtitle}>Everything you need to know about RoadScan</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚗 Quick Start Guide</Text>
        <View style={styles.instructionCard}>
          <Text style={styles.stepTitle}>1. Grant Permissions</Text>
          <Text style={styles.stepText}>
            Allow location access when prompted. This is required for GPS tracking.
          </Text>
        </View>
        <View style={styles.instructionCard}>
          <Text style={styles.stepTitle}>2. Mount Your Phone</Text>
          <Text style={styles.stepText}>
            Secure your phone in a mount or holder. Keep it level for best results.
          </Text>
        </View>
        <View style={styles.instructionCard}>
          <Text style={styles.stepTitle}>3. Start Scanning</Text>
          <Text style={styles.stepText}>
            Tap Scan → Start button. Drive normally and watch the map update in real-time.
          </Text>
        </View>
        <View style={styles.instructionCard}>
          <Text style={styles.stepTitle}>4. Stop & Save</Text>
          <Text style={styles.stepText}>
            Tap Stop when done. Choose to save or discard your scan.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Tips for Best Results</Text>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => toggleExpanded(index)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqIcon}>
                {expandedIndex === index ? '−' : '+'}
              </Text>
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Need More Help?</Text>
        <Text style={styles.footerText}>
          For additional support or to report issues, please visit our GitHub repository
          or contact support through the app settings.
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
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  instructionCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: Colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  faqItem: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  faqIcon: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '300',
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footer: {
    padding: 20,
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
