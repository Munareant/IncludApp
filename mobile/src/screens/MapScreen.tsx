import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';

interface MapScreenProps {
  onOpenMap: () => void;
  onOpenScanner: () => void;
  onOpenMenu: () => void;
  onNavigateBack?: () => void; // Swipe dreapta -> Acasă
  onNavigateNext?: () => void; // Swipe stânga -> Chat
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MapScreen: React.FC<MapScreenProps> = ({
  onOpenMap,
  onOpenScanner,
  onOpenMenu,
  onNavigateBack,
  onNavigateNext,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userRegion, setUserRegion] = useState({
    latitude: 45.7537,
    longitude: 21.2272,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });
  const [loadingLoc, setLoadingLoc] = useState(true);

  // Păstrăm funcțiile de navigare în referințe sincronizate
  const backHandlerRef = useRef(onNavigateBack);
  const nextHandlerRef = useRef(onNavigateNext);

  useEffect(() => {
    backHandlerRef.current = onNavigateBack;
  }, [onNavigateBack]);

  useEffect(() => {
    nextHandlerRef.current = onNavigateNext;
  }, [onNavigateNext]);

  // Gestul atașat pe bara superioară și pe cardul de jos
const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50 && backHandlerRef.current) {
          backHandlerRef.current();
        } else if (gestureState.dx < -50 && nextHandlerRef.current) {
          nextHandlerRef.current();
        }
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (err) {
        console.warn('Eroare preluare coordonate:', err);
      } finally {
        setLoadingLoc(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* 1. Harta Live */}
      <MapView
        style={styles.map}
        initialRegion={userRegion}
        region={userRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        <Marker
          coordinate={{
            latitude: userRegion.latitude,
            longitude: userRegion.longitude,
          }}
          title="Locația ta"
          description="Ești poziționat aici"
        />
      </MapView>

      {/* 2. Antet cu PanResponder (swipe pe Header funcționează perfect) */}
      <View style={styles.topHeaderWrapper} {...panResponder.panHandlers}>
        <HeaderBar title="IncludApp Rute" onOpenMenu={onOpenMenu} />
      </View>

      {/* Indicator subtil de asteptare GPS */}
      {loadingLoc && (
        <View style={styles.locBadge}>
          <ActivityIndicator size="small" color="#0284c7" />
          <Text style={styles.locBadgeText}>Se detectează GPS-ul...</Text>
        </View>
      )}

      {/* 3. Buton recentrare */}
      <TouchableOpacity
        style={styles.myLocationFab}
        onPress={() => {
          setUserRegion((prev) => ({ ...prev }));
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color="#0284c7" />
      </TouchableOpacity>

      {/* 4. Bottom Sheet (are și el panHandlers pe mâner/card) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomCardContainer}
      >
        <View style={styles.bottomCard}>
          {/* Mânerul pe care poți glisa stânga/dreapta fără să miști harta */}
          <View style={styles.handleTouchArea} {...panResponder.panHandlers}>
            <View style={styles.cardHandle} />
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Caută adresă sau reper asistență..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onOpenMap}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(2, 132, 199, 0.15)' }]}>
                <Ionicons name="map" size={22} color="#38bdf8" />
              </View>
              <Text style={styles.actionCardTitle}>Misiuni Active</Text>
              <Text style={styles.actionCardSub}>Radar cereri</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onOpenScanner}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="qr-code" size={22} color="#10b981" />
              </View>
              <Text style={styles.actionCardTitle}>Validare QR</Text>
              <Text style={styles.actionCardSub}>Confirmă sosirea</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  locBadge: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    zIndex: 9,
  },
  locBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  myLocationFab: {
    position: 'absolute',
    right: 20,
    bottom: 255,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 20,
  },
  handleTouchArea: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    padding: 0,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionCardSub: {
    color: '#64748b',
    fontSize: 11,
  },
});