import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GlassPanel } from './GlassPanel';
import { Colors, Spacing } from '../constants/theme';
import { AlertCircle, XCircle, CheckCircle2, Info } from 'lucide-react-native';

interface StatusModalProps {
  visible: boolean;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  type,
  title,
  message,
  buttonText = 'Dismiss',
  onClose,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error': return <XCircle size={48} color={Colors.danger} />;
      case 'success': return <CheckCircle2 size={48} color={Colors.success} />;
      case 'warning': return <AlertCircle size={48} color={Colors.warning} />;
      default: return <Info size={48} color={Colors.primary} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      default: return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const getButtonBg = () => {
    switch (type) {
      case 'error': return Colors.danger;
      case 'success': return Colors.success;
      case 'warning': return Colors.warning;
      default: return Colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <GlassPanel style={styles.modalContainer} contentStyle={styles.content} intensity={60}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBg() }]}>
            {getIcon()}
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: getButtonBg() }]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </GlassPanel>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 0,
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: Spacing.md,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
