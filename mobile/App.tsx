import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL } from './src/config/api';
import { QRScannerModal } from './src/components/QRScannerModal';
import { RequestsMapModal } from './src/components/RequestsMapModal';
import { BeneficiaryQRModal } from './src/components/BeneficiaryQRModal';

export default function App() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    // 1. Conectare Socket.io
    const socket = io(API_BASE_URL);

    socket.on('connect', () => {
      console.log('Conectat la serverul WebSocket!');
    });

    socket.on('new_sos_alert', (data) => {
      Alert.alert(
        'ALERTA SOS!',
        `O persoana din apropiere are nevoie de ajutor!\nTip: ${data.category || 'Generala'}`
      );
    });

    // 2. Cerere permisiune de localizare GPS
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Eroare', 'Permisiunea de localizare a fost refuzata.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendSOS = async () => {
    if (!location) {
      Alert.alert('Atentie', 'Se obtin coordonatele GPS. Te rugam sa astepti cateva secunde.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/requests`, {
        beneficiaryId: '00000000-0000-0000-0000-000000000001',
        title: 'Cerere SOS Urgenta',
        category: 'URGENTA',
        description: 'Am nevoie de asistenta imediata!',
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Salvam ID-ul generat si deschidem ecranul cu codul QR
      setActiveRequestId(response.data.id);
      setQrModalVisible(true);
    } catch (error: any) {
      console.log('Eroare detaliata SOS:', error.response?.data);
      const backendMessage = error.response?.data?.message 
        || JSON.stringify(error.response?.data) 
        || error.message;
      Alert.alert('Eroare Backend', `Status ${error.response?.status}: ${backendMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IncludApp Mobile</Text>
      
      {location ? (
        <Text style={styles.coords}>
          GPS: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.coords}>Se cauta semnal GPS...</Text>
      )}

      {/* Buton SOS Beneficiar */}
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={handleSendSOS} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.sosText}>SOS</Text>
        )}
      </TouchableOpacity>

      {/* Buton Scanner QR Voluntar */}
      <TouchableOpacity 
        style={styles.volunteerButton} 
        onPress={() => setScannerVisible(true)}
      >
        <Text style={styles.volunteerButtonText}>Scaneaza QR (Voluntar)</Text>
      </TouchableOpacity>

      {/* Buton Vizualizare Harta */}
      <TouchableOpacity 
        style={[styles.volunteerButton, { backgroundColor: '#0284c7', marginTop: 12 }]} 
        onPress={() => setMapVisible(true)}
      >
        <Text style={styles.volunteerButtonText}>Vezi Cereri pe Harta</Text>
      </TouchableOpacity>

      {/* Modal Scanner QR Voluntar */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        volunteerId="00000000-0000-0000-0000-000000000002"
        onSuccess={() => console.log('Misiune completata!')}
      />

      {/* Modal Harta Interactiva */}
      <RequestsMapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        userLocation={location}
      />

      {/* Modal Cod QR Beneficiar */}
      <BeneficiaryQRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        requestId={activeRequestId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  coords: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 40,
  },
  sosButton: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  volunteerButton: {
    marginTop: 30,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: 260,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  volunteerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});