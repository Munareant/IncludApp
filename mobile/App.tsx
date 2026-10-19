import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './src/config/api';

import { QRScannerModal } from './src/components/QRScannerModal';
import { RequestsMapModal } from './src/components/RequestsMapModal';
import { BeneficiaryQRModal } from './src/components/BeneficiaryQRModal';
import { ChatModal } from './src/components/ChatModal';
import { AuthModal } from './src/components/AuthModal';

const FALLBACK_VOLUNTEER_ID = '00000000-0000-0000-0000-000000000002';
const FALLBACK_BENEFICIARY_ID = '00000000-0000-0000-0000-000000000001';

export default function App() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [volunteerPoints, setVolunteerPoints] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authVisible, setAuthVisible] = useState(false);

  const activeUserId = currentUser?.id || FALLBACK_VOLUNTEER_ID;

  const fetchVolunteerPoints = useCallback(async (userId?: string) => {
    const idToFetch = userId || activeUserId;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${idToFetch}/points`);
      if (response.data && response.data.volunteer_points !== undefined) {
        setVolunteerPoints(response.data.volunteer_points);
      }
    } catch {
      // Ramane valoarea locala daca ruta nu este inca expusa
    }
  }, [activeUserId]);

  // Verificare autentificare la pornire
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = await SecureStore.getItemAsync('user_data');
        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          setCurrentUser(userObj);
          if (userObj.volunteerPoints !== undefined) {
            setVolunteerPoints(userObj.volunteerPoints);
          }
          fetchVolunteerPoints(userObj.id);
        } else {
          setAuthVisible(true);
        }
      } catch {
        setAuthVisible(true);
      }
    };
    checkAuth();
  }, [fetchVolunteerPoints]);

  // Sockets si GPS
  useEffect(() => {
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
  }, []);

  const handleSendSOS = async () => {
    if (!location) {
      Alert.alert('Atentie', 'Se obtin coordonatele GPS. Te rugam sa astepti cateva secunde.');
      return;
    }

    setLoading(true);
    try {
      const beneficiaryId = currentUser?.id || FALLBACK_BENEFICIARY_ID;
      const response = await axios.post(`${API_BASE_URL}/api/requests`, {
        beneficiaryId,
        title: 'Cerere SOS Urgenta',
        category: 'URGENTA',
        description: 'Am nevoie de asistenta imediata!',
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const newRequestId = response.data?.request?.id || response.data?.id;
      setActiveRequestId(newRequestId);
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

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
    setCurrentUser(null);
    setAuthVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IncludApp Mobile</Text>
      
      {currentUser && (
        <Text style={styles.userGreeting}>
          Salut, {currentUser.fullName || currentUser.full_name || 'Utilizator'} ({currentUser.role || 'Membru'})
        </Text>
      )}

      {/* Badge Punctaj Voluntar */}
      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>⭐ Puncte voluntar: {volunteerPoints}</Text>
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

      {/* Buton Deschidere Chat Misiune */}
      <TouchableOpacity
        style={[styles.volunteerButton, { backgroundColor: '#6366f1', marginTop: 12 }]}
        onPress={() => setChatVisible(true)}
      >
        <Text style={styles.volunteerButtonText}>💬 Deschide Chat Misiune</Text>
      </TouchableOpacity>

      {/* Buton Deconectare */}
      {currentUser && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Deconectare cont</Text>
        </TouchableOpacity>
      )}

      {/* Modal Scanner QR Voluntar */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        volunteerId={currentUser?.id || FALLBACK_VOLUNTEER_ID}
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
        currentUserId={currentUser?.id || FALLBACK_VOLUNTEER_ID}
        requestTitle="Misiune IncludApp"
      />

      {/* Modal Autentificare / Înregistrare */}
      <AuthModal
        visible={authVisible}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.volunteerPoints !== undefined) {
            setVolunteerPoints(user.volunteerPoints);
          }
          setAuthVisible(false);
          fetchVolunteerPoints(user.id);
        }}
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
    marginBottom: 2,
  },
  userGreeting: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  sosButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
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
    marginTop: 14,
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
  logoutButton: {
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});