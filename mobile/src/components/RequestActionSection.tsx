import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BeneficiaryQRModal } from './BeneficiaryQRModal';
import { QRScannerModal } from './QRScannerModal';

export interface RequestData {
  id: string;
  status: 'OPEN' | 'ASSIGNED' | 'COMPLETED' | string;
  beneficiary_id: string;
  volunteer_id?: string | null;
  title?: string;
  category?: string;
}

interface RequestActionSectionProps {
  request: RequestData;
  currentUserId: string;
  onSuccess?: () => void;
}

export const RequestActionSection: React.FC<RequestActionSectionProps> = ({
  request,
  currentUserId,
  onSuccess,
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Butoanele apar doar dacă cererea a fost acceptată (stadiul ASSIGNED)
  if (request.status !== 'ASSIGNED') {
    return null;
  }

  const isBeneficiary = currentUserId === request.beneficiary_id;
  const isVolunteer = currentUserId === request.volunteer_id;

  return (
    <View style={styles.container}>
      {/* 1. Buton pentru Beneficiar (Afișează codul QR) */}
      {isBeneficiary && (
        <TouchableOpacity
          style={[styles.button, styles.btnBeneficiary]}
          onPress={() => setShowQRModal(true)}
        >
          <Text style={styles.buttonText}>📱 Arată Codul QR Solicitant</Text>
        </TouchableOpacity>
      )}

      {/* 2. Buton pentru Voluntar (Deschide camera pentru scanare) */}
      {isVolunteer && (
        <TouchableOpacity
          style={[styles.button, styles.btnVolunteer]}
          onPress={() => setShowScannerModal(true)}
        >
          <Text style={styles.buttonText}>📷 Scanează QR pentru Finalizare (+50 pct)</Text>
        </TouchableOpacity>
      )}

      {/* Modal afișare QR pentru solicitant */}
      <BeneficiaryQRModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        requestId={request.id}
        category={request.category}
      />

      {/* Modal scanare QR pentru voluntar */}
      <QRScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        volunteerId={currentUserId}
        onSuccess={() => {
          if (onSuccess) onSuccess();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    elevation: 3,
  },
  btnBeneficiary: {
    backgroundColor: '#2563eb',
  },
  btnVolunteer: {
    backgroundColor: '#16a34a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});