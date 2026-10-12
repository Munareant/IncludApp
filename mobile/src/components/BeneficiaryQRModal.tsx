import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface BeneficiaryQRModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: string | null;
  category?: string;
}

export const BeneficiaryQRModal: React.FC<BeneficiaryQRModalProps> = ({
  visible,
  onClose,
  requestId,
  category = 'URGENTA',
}) => {
  if (!visible || !requestId) return null;

  const qrData = JSON.stringify({
    requestId,
    timestamp: Date.now(),
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Cerere SOS Activă</Text>
          <Text style={styles.subtitle}>Tip asistență: {category}</Text>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={220}
              backgroundColor="#ffffff"
              color="#0f172a"
            />
          </View>

          <Text style={styles.instructions}>
            Arată acest cod QR voluntarului sosit la fața locului pentru a confirma ajutorul primit.
          </Text>

          <Text style={styles.requestIdText}>ID Cerere: {requestId.slice(0, 8)}...</Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.buttonText}>Închide / Finalizează</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ef4444',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    fontWeight: '500',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  requestIdText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  closeButton: {
    marginTop: 32,
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});