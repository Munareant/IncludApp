import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  volunteerId: string;
  onSuccess: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  volunteerId,
  onSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!visible) return null;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <Text style={styles.text}>Aplicația are nevoie de permisiunea camerei pentru a scana codul QR.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Permite Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.buttonText}>Închide</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      let parsedRequestId = data;
      try {
        const json = JSON.parse(data);
        if (json.requestId) {
          parsedRequestId = json.requestId;
        }
      } catch {
        // ID-ul este direct string simplu
      }

      const response = await axios.post(`${API_BASE_URL}/api/requests/${parsedRequestId}/complete`, {
        volunteerId,
      });

      Alert.alert(
        'Validare Reușită!',
        `Misiunea a fost finalizată. Puncte: ${response.data.pointsAwarded || 10}`,
        [
          {
            text: 'Super',
            onPress: () => {
              setScanned(false);
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Eroare Validare',
        error.response?.data?.message || 'Codul QR nu este valid sau cererea a fost deja finalizată.',
        [{ text: 'Reîncearcă', onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instructionText}>Scanează codul QR al beneficiarului</Text>

          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.buttonText}>Anulează</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  text: {
    color: '#f8fafc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 15,
    marginTop: 20,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 15,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    position: 'absolute',
    bottom: 40,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});