import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface SOSButtonProps {
  userId: string | number;
  latitude: number | null;
  longitude: number | null;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ userId, latitude, longitude }) => {
  const [loading, setLoading] = useState(false);

  const triggerSOS = () => {
    if (!latitude || !longitude) {
      Alert.alert('Eroare GPS', 'Așteaptă preluarea coordonatelor GPS înainte de a transmite alerta.');
      return;
    }

    Alert.alert(
      'DECLANȘARE ALERTĂ SOS',
      'Ești sigur că vrei să apelezi rețeaua de urgență IncludApp? Toți voluntarii din zonă vor primi locația ta.',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'DA, TRANSMITE',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await axios.post(`${API_BASE_URL}/api/requests/sos`, {
                userId,
                latitude,
                longitude,
                details: 'Solicitare urgentă prin butonul SOS',
              });

              Alert.alert('Alertă Transmisă', res.data.message);
            } catch (err: any) {
              Alert.alert('Eroare', 'Nu s-a putut transmite alerta. Dacă e o urgență critică, apelează 112.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.sosButton}
      onPress={triggerSOS}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <>
          <Ionicons name="warning" size={18} color="#ffffff" style={styles.icon} />
          <Text style={styles.sosText}>SOS</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute',
    top: 130,
    left: 16,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    marginRight: 6,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});