import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface RequestItem {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
}

interface RequestsMapModalProps {
  visible: boolean;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export const RequestsMapModal: React.FC<RequestsMapModalProps> = ({
  visible,
  onClose,
  userLocation,
}) => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userLocation) {
      fetchNearbyRequests();
    }
  }, [visible, userLocation]);

  const fetchNearbyRequests = async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/requests/nearby`, {
        params: {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          radius: 5000,
        },
      });

      let items: RequestItem[] = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      }

      setRequests(items);
    } catch (error: any) {
      Alert.alert(
        'Eroare',
        error.response?.data?.message || error.response?.data?.error || 'Nu s-au putut încărca cererile.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (requestId: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/requests/${requestId}/assign`, {
        volunteerId: '00000000-0000-0000-0000-000000000002',
      });

      Alert.alert('Succes!', 'Ai preluat cererea de asistență. Mergi la beneficiar și scanează codul QR.');
      fetchNearbyRequests();
    } catch (error: any) {
      Alert.alert(
        'Eroare preluare',
        error.response?.data?.message || error.response?.data?.error || 'Cererea nu a putut fi preluată.'
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {userLocation ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
          >
            <Circle
              center={userLocation}
              radius={5000}
              strokeColor="rgba(56, 189, 248, 0.8)"
              fillColor="rgba(56, 189, 248, 0.15)"
            />

            {requests.map((item) => (
              <Marker
                key={item.id}
                coordinate={{
                  latitude: Number(item.latitude),
                  longitude: Number(item.longitude),
                }}
                pinColor="#dc2626"
              >
                <Callout onPress={() => handleAssign(item.id)}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{item.title || 'Cerere SOS'}</Text>
                    <Text style={styles.calloutDesc}>{item.description || 'Nevoie de ajutor'}</Text>
                    {item.distance_meters !== undefined && (
                      <Text style={styles.calloutDistance}>Distanță: {item.distance_meters} m</Text>
                    )}
                    <View style={styles.acceptBadge}>
                      <Text style={styles.acceptBadgeText}>Apasă pentru a prelua</Text>
                    </View>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingText}>Se așteaptă coordonatele GPS...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={fetchNearbyRequests}>
          <Text style={styles.buttonText}>
            {loading ? 'Se încarcă...' : `Reîncarcă (${requests?.length || 0})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.buttonText}>Închide Harta</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
  },
  refreshButton: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  calloutContainer: {
    width: 200,
    padding: 6,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 2,
  },
  calloutDesc: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 11,
    color: '#0284c7',
    marginBottom: 6,
  },
  acceptBadge: {
    backgroundColor: '#10b981',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
});