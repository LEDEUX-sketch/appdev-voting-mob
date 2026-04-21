import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassPanel } from '@/components/GlassPanel';
import { Colors } from '@/constants/theme';
import { CircleCheck, Home, Share2 } from 'lucide-react-native';

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.pulse1} />
          <View style={styles.pulse2} />
          <CircleCheck size={100} color={Colors.success} fill="rgba(16, 185, 129, 0.1)" />
        </View>

        <Text style={styles.title}>Vote Cast Successfully!</Text>
        <Text style={styles.message}>
          Your ballot has been securely encrypted and recorded in the system. Thank you for participating in the democratic process.
        </Text>

        <GlassPanel style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            You have now been marked as "Voted" for this election. You can view the results once the administrator concludes the voting period.
          </Text>
        </GlassPanel>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.replace('/dashboard')}
        >
          <Home size={20} color="#fff" style={{marginRight: 10}} />
          <Text style={styles.buttonText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pulse1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.success,
    borderRadius: 75,
    opacity: 0.1,
    transform: [{ scale: 1.2 }],
  },
  pulse2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.success,
    borderRadius: 75,
    opacity: 0.05,
    transform: [{ scale: 1.4 }],
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    color: Colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  infoCard: {
    width: '100%',
    marginBottom: 40,
  },
  infoTitle: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
