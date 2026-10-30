import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { HeaderBar } from '../components/HeaderBar';
import { QRScannerModal } from '../components/QRScannerModal';
import { RatingModal } from '../components/RatingModal';
import { SOSButton } from '../components/SOSButton';
import { API_BASE_URL } from '../config/api';

const BOTTOM_NAV_HEIGHT = 75;
const PANEL_COLLAPSED_HEIGHT = BOTTOM_NAV_HEIGHT + 38;
const PANEL_EXPANDED_HEIGHT = BOTTOM_NAV_HEIGHT + 230;
const TRANSLATION_LIMIT = PANEL_EXPANDED_HEIGHT - PANEL_COLLAPSED_HEIGHT;
const LATITUDE_OFFSET = 0.005;

interface AssistanceRequest {
  id: string | number;
  beneficiary_id?: string | number;
  beneficiary_name?: string;
  title: string;
  description: string;
  disability_type: string;
  latitude: number;
  longitude: number;
  status: string;
  distance_km?: number;
}

interface MapScreenProps {
  onOpenMenu: () => void;
  currentUser?: {
    id: string | number;
    name?: string;
  };
}

export const MapScreen: React.FC<MapScreenProps> = ({ onOpenMenu, currentUser }) => {
  const mapRef = useRef<MapView>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequest | null>(null);
  const [activeMission, setActiveMission] = useState<AssistanceRequest | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  // Stări pentru Modalele de Validare & Rating
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisiune refuzată', 'Activează localizarea pentru a vedea cererile.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserCoords(coords);
      fetchNearbyRequests(coords.latitude, coords.longitude);

      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude + LATITUDE_OFFSET,
          longitude: coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        1000
      );
    })();
  }, []);

  const fetchNearbyRequests = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/requests/nearby?lat=${lat}&lng=${lng}`);
      setRequests(res.data);
      if (res.data.length > 0 && !selectedRequest) {
        setSelectedRequest(res.data[0]);
      }
    } catch (err) {
      console.warn('Nu s-au putut prelua cererile apropiate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecenter = () => {
    if (userCoords && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userCoords.latitude + LATITUDE_OFFSET,
          longitude: userCoords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        800
      );
    }
  };

  const togglePanel = (expand: boolean) => {
    Animated.spring(translateY, {
      toValue: expand ? 0 : TRANSLATION_LIMIT,
      useNativeDriver: true,
      bounciness: 4,
    }).start(() => setIsExpanded(expand));
  };

  const handleAcceptRequest = async (request: AssistanceRequest) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/requests/${request.id}/accept`, {
        volunteerId: currentUser?.id || 1,
      });
      setActiveMission(request);
      Alert.alert(
        'Misiune Preluată! 🚀',
        `Ai preluat cererea "${request.title}". Mergi la locație și scanează codul QR de pe telefonul beneficiarului la sosire.`
      );
      if (userCoords) {
        fetchNearbyRequests(userCoords.latitude, userCoords.longitude);
      }
    } catch (err: any) {
      Alert.alert('Eroare', 'Cererea nu a putut fi preluată sau a fost acceptată de altcineva.');
    }
  };

  const bottomSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (isExpanded) {
          if (gestureState.dy > 0 && gestureState.dy <= TRANSLATION_LIMIT) {
            translateY.setValue(gestureState.dy);
          }
        } else {
          if (gestureState.dy < 0 && gestureState.dy >= -TRANSLATION_LIMIT) {
            translateY.setValue(TRANSLATION_LIMIT + gestureState.dy);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isExpanded) {
          if (gestureState.dy > 50 || gestureState.vy > 0.5) {
            togglePanel(false);
          } else {
            togglePanel(true);
          }
        } else {
          if (gestureState.dy < -50 || gestureState.vy < -0.5) {
            togglePanel(true);
          } else {
            togglePanel(false);
          }
        }
      },
    })
  ).current;

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'ALL') return true;
    return r.disability_type?.toUpperCase() === activeFilter;
  });

  return (
    <View style={styles.container}>
      <HeaderBar title="Hartă Interactivă" onOpenMenu={onOpenMenu} />

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        mapPadding={{ top: 90, right: 0, bottom: 60, left: 0 }}
        initialRegion={{
          latitude: 45.7537,
          longitude: 21.2257,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {filteredRequests.map((req) => (
          <Marker
            key={req.id}
            coordinate={{
              latitude: Number(req.latitude),
              longitude: Number(req.longitude),
            }}
            pinColor={req.disability_type === 'BLIND' ? '#f59e0b' : '#0284c7'}
            onPress={() => {
              setSelectedRequest(req);
              togglePanel(true);
            }}
          />
        ))}
      </MapView>

      {/* Buton Alertă SOS */}
      <SOSButton
        userId={currentUser?.id || 1}
        latitude={userCoords?.latitude || null}
        longitude={userCoords?.longitude || null}
      />

      {/* Buton Recantrare Locație */}
      <TouchableOpacity style={styles.myLocationButton} onPress={handleRecenter}>
        <Ionicons name="locate" size={24} color="#0284c7" />
      </TouchableOpacity>

      {/* Panoul Inferior Glisant */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <View {...bottomSheetPanResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.dragHandleIndicator} />
          <TouchableOpacity style={styles.collapseToggle} onPress={() => togglePanel(!isExpanded)}>
            <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-up'} size={18} color="#94a3b8" />
            <Text style={styles.toggleText}>
              {isExpanded ? 'Glisează jos pentru hartă' : 'Afișează cereri active'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Misiune În Desfășurare SAU Card Cerere Selectată */}
        {activeMission ? (
          <View style={[styles.sectionCard, styles.activeMissionCard]}>
            <View style={styles.requestHeaderRow}>
              <Text style={styles.sectionHeader} numberOfLines={1}>
                MISIUNE ACTIVĂ: {activeMission.title}
              </Text>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressText}>În curs</Text>
              </View>
            </View>
            <Text style={styles.sectionDescription} numberOfLines={2}>
              {activeMission.description}
            </Text>

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => setIsScannerOpen(true)}
            >
              <Ionicons name="qr-code-outline" size={18} color="#ffffff" style={styles.btnIcon} />
              <Text style={styles.scanBtnText}>Scanează QR Beneficiar</Text>
            </TouchableOpacity>
          </View>
        ) : selectedRequest ? (
          <View style={styles.sectionCard}>
            <View style={styles.requestHeaderRow}>
              <Text style={styles.sectionHeader} numberOfLines={1}>
                {selectedRequest.title}
              </Text>
              {selectedRequest.distance_km !== undefined && (
                <Text style={styles.distanceBadge}>
                  {Number(selectedRequest.distance_km).toFixed(1)} km
                </Text>
              )}
            </View>
            <Text style={styles.sectionDescription} numberOfLines={2}>
              {selectedRequest.description || 'Fără descriere adițională.'}
            </Text>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAcceptRequest(selectedRequest)}
            >
              <Text style={styles.actionBtnText}>Acceptă Misiunea</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Nicio cerere selectată</Text>
            <Text style={styles.sectionDescription}>
              Selectează un punct de pe hartă pentru a vedea cererea de sprijin.
            </Text>
          </View>
        )}

        {/* Filtre Categorii */}
        <View style={styles.sectionCard}>
          <Text style={styles.filterTitle}>Filtrează după Tipul de Nevoie</Text>
          <View style={styles.filterRow}>
            {['ALL', 'MOBILITY', 'BLIND', 'OTHER'].map((filterKey) => (
              <TouchableOpacity
                key={filterKey}
                style={[styles.chip, activeFilter === filterKey && styles.chipActive]}
                onPress={() => setActiveFilter(filterKey)}
              >
                <Text style={[styles.chipText, activeFilter === filterKey && styles.chipTextActive]}>
                  {filterKey === 'ALL'
                    ? 'Toate'
                    : filterKey === 'MOBILITY'
                    ? 'Locomotor'
                    : filterKey === 'BLIND'
                    ? 'Nevăzători'
                    : 'Altele'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Modal Scanner Cameră QR */}
      {activeMission && (
        <QRScannerModal
          visible={isScannerOpen}
          requestId={activeMission.id}
          volunteerId={currentUser?.id || 1}
          onClose={() => setIsScannerOpen(false)}
          onSuccess={() => {
            setIsScannerOpen(false);
            setIsRatingOpen(true);
          }}
        />
      )}

      {/* Modal Rating Post-Misiune */}
      {activeMission && (
        <RatingModal
          visible={isRatingOpen}
          requestId={activeMission.id}
          reviewerId={currentUser?.id || 1}
          reviewedUserId={activeMission.beneficiary_id || 2}
          reviewedUserName={activeMission.beneficiary_name || 'Beneficiar'}
          onClose={() => {
            setIsRatingOpen(false);
            setActiveMission(null);
            if (userCoords) fetchNearbyRequests(userCoords.latitude, userCoords.longitude);
          }}
          onSubmitSuccess={() => {
            setIsRatingOpen(false);
            setActiveMission(null);
            if (userCoords) fetchNearbyRequests(userCoords.latitude, userCoords.longitude);
          }}
        />
      )}
    </View>
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
  myLocationButton: {
    position: 'absolute',
    top: 130,
    right: 16,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_EXPANDED_HEIGHT,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_NAV_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 12,
  },
  dragArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandleIndicator: {
    width: 44,
    height: 5,
    backgroundColor: '#475569',
    borderRadius: 3,
  },
  collapseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  toggleText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  activeMissionCard: {
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#0f233a',
  },
  requestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  distanceBadge: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  inProgressBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  inProgressText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionDescription: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 6,
  },
  actionBtn: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scanBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 6,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
  },
  chipActive: {
    backgroundColor: '#0284c7',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});