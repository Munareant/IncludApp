import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL } from './src/config/api';

// Ecranele aplicatiei
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Modalele existente
import { QRScannerModal } from './src/components/QRScannerModal';
import { RequestsMapModal } from './src/components/RequestsMapModal';
import { BeneficiaryQRModal } from './src/components/BeneficiaryQRModal';
import { ChatModal } from './src/components/ChatModal';
import { AuthModal } from './src/components/AuthModal';
import { SideDrawerModal } from './src/components/SideDrawerModal';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 4;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;
const BUBBLE_WIDTH = 68;
const BUBBLE_HEIGHT = 42;

const FALLBACK_VOLUNTEER_ID = '00000000-0000-0000-0000-000000000002';
const FALLBACK_BENEFICIARY_ID = '00000000-0000-0000-0000-000000000001';

const FULL_TITLE = 'IncludApp';
const FULL_NAME = 'Munăreanț Dan Ioan';

// Componenta TabBar cu pastila elastica de sticla
const SlidingTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const stretchAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetOffset = state.index * TAB_WIDTH + (TAB_WIDTH - BUBBLE_WIDTH) / 2;

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: targetOffset,
        damping: 15,
        stiffness: 140,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(stretchAnim, {
          toValue: 1.25,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.spring(stretchAnim, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index, slideAnim, stretchAnim]);

  return (
    <View style={styles.customTabBarContainer}>
      {/* Capsula din sticla lichida cu deformare orizontala */}
      <Animated.View
        style={[
          styles.slidingBubble,
          {
            transform: [
              { translateX: slideAnim },
              { scaleX: stretchAnim },
            ],
          },
        ]}
      />

      {/* Butoanele de navigare */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName: any = 'help-outline';
        if (route.name === 'Acasă') iconName = isFocused ? 'home' : 'home-outline';
        if (route.name === 'Hartă') iconName = isFocused ? 'map' : 'map-outline';
        if (route.name === 'Chat') iconName = isFocused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
        if (route.name === 'Profil') iconName = isFocused ? 'person' : 'person-outline';

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconSlot}>
              <Ionicons
                name={iconName}
                size={23}
                color={isFocused ? '#ffffff' : '#64748b'}
              />
            </View>
            <Text
              style={[
                styles.tabLabelText,
                { color: isFocused ? '#ffffff' : '#64748b' },
              ]}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [volunteerPoints, setVolunteerPoints] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modale
  const [scannerVisible, setScannerVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  // Stari pentru animatia de Typewriter
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedName, setDisplayedName] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('Inițializare sistem...');
  const progressAnim = useRef(new Animated.Value(0)).current;

  const activeUserId = currentUser?.id || FALLBACK_VOLUNTEER_ID;

  const fetchVolunteerPoints = useCallback(async (userId?: string) => {
    const idToFetch = userId || activeUserId;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${idToFetch}/points`);
      if (response.data && response.data.volunteer_points !== undefined) {
        setVolunteerPoints(response.data.volunteer_points);
      }
    } catch {
      // Pastreaza valoarea curenta
    }
  }, [activeUserId]);

  // Initializare & Animatie Loading
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4200,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }).start();

    let titleIdx = 0;
    const titleInterval = setInterval(() => {
      titleIdx++;
      setDisplayedTitle(FULL_TITLE.slice(0, titleIdx));
      if (titleIdx >= FULL_TITLE.length) {
        clearInterval(titleInterval);
      }
    }, 120);

    let nameIdx = 0;
    let nameInterval: any;
    const nameTimeout = setTimeout(() => {
      nameInterval = setInterval(() => {
        nameIdx++;
        setDisplayedName(FULL_NAME.slice(0, nameIdx));
        if (nameIdx >= FULL_NAME.length) {
          clearInterval(nameInterval);
        }
      }, 90);
    }, 900);

    const initApp = async () => {
      try {
        await new Promise((r) => setTimeout(r, 1200));
        setLoadingStatus('Căutare sesiune utilizator...');

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

        await new Promise((r) => setTimeout(r, 1300));
        setLoadingStatus('Obținere coordonate GPS...');

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        }

        await new Promise((r) => setTimeout(r, 1200));
        setLoadingStatus('Sistem pregătit. Conectare...');

        await new Promise((r) => setTimeout(r, 800));
        setIsAppReady(true);
      } catch (err) {
        console.warn('Eroare initializare:', err);
        setTimeout(() => setIsAppReady(true), 1000);
      }
    };

    initApp();

    return () => {
      clearInterval(titleInterval);
      clearTimeout(nameTimeout);
      if (nameInterval) clearInterval(nameInterval);
    };
  }, [fetchVolunteerPoints, progressAnim]);

  // Conexiune Socket.io
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

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendSOS = async () => {
    if (!location) {
      Alert.alert('Atenție', 'Se obțin coordonatele GPS. Te rugăm să aștepți câteva secunde.');
      return;
    }

    setLoading(true);
    try {
      const beneficiaryId = currentUser?.id || FALLBACK_BENEFICIARY_ID;
      const response = await axios.post(`${API_BASE_URL}/api/requests`, {
        beneficiaryId,
        title: 'Cerere SOS Urgenta',
        category: 'URGENTA',
        description: 'Am nevoie de asistență imediată!',
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const newRequestId = response.data?.request?.id || response.data?.id;
      setActiveRequestId(newRequestId);
      setQrModalVisible(true);
    } catch (error: any) {
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
    Alert.alert('Felicitări!', 'Misiune finalizată cu succes! Ai primit +50 puncte.');
    fetchVolunteerPoints();
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
    setCurrentUser(null);
    setAuthVisible(true);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // 1. ECRANUL DE LOADING
  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.titleRow}>
            <Text style={styles.loadingLogoText}>{displayedTitle}</Text>
            {displayedTitle.length < FULL_TITLE.length && (
              <Text style={styles.blinkingCursor}>|</Text>
            )}
          </View>

          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBarActive, { width: progressWidth }]} />
          </View>

          <Text style={styles.loadingStatusText}>{loadingStatus}</Text>
        </View>

        <View style={styles.loadingFooter}>
          <Text style={styles.creditLabel}>Dezvoltat de</Text>
          <View style={styles.nameRow}>
            <Text style={styles.creditName}>{displayedName}</Text>
            {displayedName.length > 0 && displayedName.length < FULL_NAME.length && (
              <Text style={styles.blinkingCursorSmall}>|</Text>
            )}
          </View>
          <Text style={styles.creditVersion}>v1.0 • 2026</Text>
        </View>
      </View>
    );
  }

  // 2. NAVIGATORUL CU TABBAR GLISANT LIQUID
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <SlidingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Acasă">
          {() => (
            <HomeScreen
              currentUser={currentUser}
              location={location}
              loading={loading}
              onSendSOS={handleSendSOS}
              volunteerPoints={volunteerPoints}
              onOpenMenu={() => setDrawerVisible(true)}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Hartă">
          {() => (
            <MapScreen
              onOpenMap={() => setMapVisible(true)}
              onOpenScanner={() => setScannerVisible(true)}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Chat">
          {() => (
            <ChatScreen
              onOpenChat={() => setChatVisible(true)}
              activeRequestId={activeRequestId}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Profil">
          {() => (
            <ProfileScreen
              currentUser={currentUser}
              volunteerPoints={volunteerPoints}
              onLogout={handleLogout}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Meniu Lateral Tip Drawer */}
      <SideDrawerModal
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Modale Globale */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        volunteerId={currentUser?.id || FALLBACK_VOLUNTEER_ID}
        onSuccess={handleMissionSuccess}
      />

      <RequestsMapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        userLocation={location}
      />

      <BeneficiaryQRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        requestId={activeRequestId}
      />

      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        requestId={activeRequestId || '00000000-0000-0000-0000-000000000099'}
        currentUserId={currentUser?.id || FALLBACK_VOLUNTEER_ID}
        requestTitle="Misiune IncludApp"
      />

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
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  loadingLogoText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  blinkingCursor: {
    fontSize: 38,
    color: '#10b981',
    fontWeight: '300',
    marginLeft: 3,
  },
  progressBarContainer: {
    width: 200,
    height: 3,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    marginTop: 35,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  loadingStatusText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  loadingFooter: {
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 65,
  },
  creditLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.8,
  },
  blinkingCursorSmall: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  creditVersion: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
  },
  // TabBar cu pastila dinamica liquid glass
  customTabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#0a0f1d',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 22,
    paddingTop: 8,
    position: 'relative',
  },
  slidingBubble: {
    position: 'absolute',
    top: 6,
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    borderRadius: BUBBLE_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconSlot: {
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 1,
  },
});