import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { connectSocket } from './src/services/socket';
import { API_BASE_URL } from './src/config/api';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Eroare', 'Permisiunea de localizare este necesara pentru IncludApp.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();

    const socket = connectSocket();
    socket.on('new_sos_alert', (alertData: any) => {
      console.log('Alerta SOS primita:', alertData);
      setIncomingAlert(alertData);
    });

    return () => {
      socket.off('new_sos_alert');
    };
  }, []);

  const triggerSOS = async () => {
    if (!location) {
      Alert.alert('Asteapta', 'Se citesc coordonatele GPS...');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/requests`, {
        beneficiaryId: 'a0000000-0000-0000-0000-000000000001',
        title: 'Asistenta mobilitate solicitata',
        description: 'Beneficiarul are nevoie de sprijin imediat.',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      Alert.alert('Trimis!', `Cererea SOS a fost inregistrata cu ID: ${response.data.id}`);
    } catch (error: any) {
      console.error('Eroare SOS:', error.message);
      Alert.alert('Eroare conexiune', 'Verifica IP-ul serverului si conexiunea Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>IncludApp Mobile</Text>

      {location ? (
        <Text style={styles.gpsText}>
          GPS: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.gpsText}>Se cauta semnalul GPS...</Text>
      )}

      <TouchableOpacity 
        style={[styles.sosButton, loading && styles.disabledButton]} 
        onPress={triggerSOS}
        disabled={loading}
      >
        <Text style={styles.sosButtonText}>{loading ? 'SE TRIMITE...' : 'TRIMITE SOS'}</Text>
      </TouchableOpacity>

      {incomingAlert && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>ALERTA SOS IN APROPIERE!</Text>
          <Text style={styles.alertBody}>{incomingAlert.title}</Text>
          <Text style={styles.alertBody}>Descriere: {incomingAlert.description}</Text>
          <Text style={styles.alertCoords}>
            Lat: {incomingAlert.latitude} | Lng: {incomingAlert.longitude}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  gpsText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 40,
  },
  sosButton: {
    backgroundColor: '#EF4444',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#7F1D1D',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  alertCard: {
    marginTop: 40,
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    borderLeftWidth: 5,
    borderLeftColor: '#F59E0B',
  },
  alertTitle: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  alertBody: {
    color: '#E2E8F0',
    fontSize: 14,
    marginBottom: 4,
  },
  alertCoords: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
});