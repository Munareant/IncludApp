import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL } from './src/config/api';
import { QRScannerModal } from './src/components/QRScannerModal';
import { RequestsMapModal } from './src/components/RequestsMapModal';
import { BeneficiaryQRModal } from './src/components/BeneficiaryQRModal';
import { ChatModal } from './src/components/ChatModal';

const CURRENT_VOLUNTEER_ID = '00000000-0000-0000-0000-000000000002';
const CURRENT_BENEFICIARY_ID = '00000000-0000-0000-0000-000000000001';

export default function App() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [volunteerPoints, setVolunteerPoints] = useState<number>(0);

  const fetchVolunteerPoints = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${CURRENT_VOLUNTEER_ID}/points`);
      if (response.data && response.data.volunteer_points !== undefined) {
        setVolunteerPoints(response.data.volunteer_points);
      }
    } catch {
      // Ramane valoarea locala daca ruta nu este definita inca
    }
  }, []);

  useEffect(() => {
    fetchVolunteerPoints();

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
  }, [fetchVolunteerPoints]);

  const handleSendSOS = async () => {
    if (!location) {
      Alert.alert('Atentie', 'Se obtin coordonatele GPS. Te rugam sa astepti cateva secunde.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/requests`, {
        beneficiaryId: CURRENT_BENEFICIARY_ID,
        title: 'Cerere SOS Urgenta',
        category: 'URGENTA',
        description: 'Am nevoie de asistenta imediata!',
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setActiveRequestId(response.data.id);
      setQrModalVisible(true);
    } catch (error: any) {
      console.log('Eroare detaliata SOS:', error.response?.data);
      const backendMessage =
        error.response?.data?.message ||
        JSON.stringify(error.response?.data) ||
        error.message;
      Alert.alert('Eroare Backend', `Status ${error.response?.status}: ${backendMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMissionSuccess = () => {
    setVolunteerPoints((prev) => prev + 50);
    Alert.alert('Felicitari!', 'Misiune finalizata cu succes! Ai primit +50 puncte.');
    fetchVolunteerPoints();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IncludApp Mobile</Text>

      {/* Badge Punctaj Voluntar */}
      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>⭐ Puncte Voluntar: {volunteerPoints}</Text>
      </View>

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

      {/* Buton Deschidere Chat Misiune (Vizibil mereu) */}
      <TouchableOpacity
        style={[styles.volunteerButton, { backgroundColor: '#6366f1', marginTop: 12 }]}
        onPress={() => setChatVisible(true)}
      >
        <Text style={styles.volunteerButtonText}>💬 Deschide Chat Misiune</Text>
      </TouchableOpacity>

      {/* Modal Scanner QR Voluntar */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        volunteerId={CURRENT_VOLUNTEER_ID}
        onSuccess={handleMissionSuccess}
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

      {/* Modal Chat Misiune */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        requestId={activeRequestId || '00000000-0000-0000-0000-000000000099'}
        currentUserId={CURRENT_VOLUNTEER_ID}
        requestTitle="Misiune IncludApp"
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
    marginBottom: 4,
  },
  pointsBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 8,
  },
  pointsText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  coords: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 30,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
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
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  volunteerButton: {
    marginTop: 20,
    backgroundColor: '#10b981',
    paddingVertical: 13,
    paddingHorizontal: 24,
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
    fontSize: 15,
    fontWeight: '700',
  },
});