import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Switch,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SideDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  volunteerPoints: number;
  onLogout: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 310);

export const SideDrawerModal: React.FC<SideDrawerModalProps> = ({
  visible,
  onClose,
  currentUser,
  volunteerPoints,
  onLogout,
}) => {
  const [highContrast, setHighContrast] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Animatii pentru translatie si opacitate fundal
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleQRInfo = () => {
    Alert.alert(
      'Validare Misiune prin QR',
      '1. Beneficiarul generează un cod QR unic când lansează alerta SOS.\n\n' +
      '2. Voluntarul scanează codul la fața locului folosind camera din tab-ul Hartă.\n\n' +
      '3. Misiunea este confirmată instant, iar voluntarul primește +50 de puncte în cont.',
      [{ text: 'Am înțeles', style: 'default' }]
    );
  };

  const handleAboutApp = () => {
    Alert.alert(
      'Despre IncludApp',
      'IncludApp v1.0 • 2026\n\n' +
      'Platformă inteligentă dedicată asistenței comunitare rapide pentru persoane cu dizabilități, integrând geolocalizare de precizie, comunicare în timp real și validare securizată a intervențiilor.',
      [{ text: 'Închide', style: 'default' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Confidențialitate & Date',
      'Coordonatele GPS sunt procesate exclusiv pe durata unei misiuni active și nu sunt partajate cu terți. Toate datele transmise în chat sunt criptate.',
      [{ text: 'În regulă', style: 'default' }]
    );
  };

  const handleAccessibilityHelp = () => {
    Alert.alert(
      'Ghid Accesibilitate',
      'Aplicația suportă cititoare de ecran (TalkBack / VoiceOver). Modul de contrast ridicat optimizează paleta de culori pentru persoanele cu deficiențe de vedere.',
      [{ text: 'Închide', style: 'default' }]
    );
  };

  if (!showModal) return null;

  return (
    <Modal visible={showModal} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Backdrop animat lin cu fade */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sertar glisant din stanga cu translatie pe X */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header Profil Utilizator */}
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser?.fullName || currentUser?.full_name || 'Utilizator IncludApp'}
              </Text>
              <Text style={styles.userRole}>
                {currentUser?.role === 'BENEFICIARY' ? 'Beneficiar' : 'Voluntar'} • ⭐ {volunteerPoints} pct
              </Text>
            </View>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Sectiunea 1: Accesibilitate */}
            <Text style={styles.sectionTitle}>ACCESIBILITATE & CONFORT</Text>

            <View style={styles.toggleRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="contrast-outline" size={20} color="#38bdf8" />
                <Text style={styles.rowText}>Contrast ridicat</Text>
              </View>
              <Switch
                value={highContrast}
                onValueChange={setHighContrast}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={highContrast ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="volume-high-outline" size={20} color="#38bdf8" />
                <Text style={styles.rowText}>Ghidare vocală</Text>
              </View>
              <Switch
                value={voiceGuidance}
                onValueChange={setVoiceGuidance}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={voiceGuidance ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="text-outline" size={20} color="#38bdf8" />
                <Text style={styles.rowText}>Text mărit</Text>
              </View>
              <Switch
                value={largeText}
                onValueChange={setLargeText}
                trackColor={{ false: '#334155', true: '#6366f1' }}
                thumbColor={largeText ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View style={styles.divider} />

            {/* Sectiunea 2: Ghiduri */}
            <Text style={styles.sectionTitle}>GHIDURI & MISIUNI</Text>

            <TouchableOpacity style={styles.menuButton} onPress={handleQRInfo} activeOpacity={0.7}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="qr-code-outline" size={20} color="#10b981" />
                <Text style={styles.menuButtonText}>Cum funcționează codul QR</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleAccessibilityHelp} activeOpacity={0.7}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="hand-left-outline" size={20} color="#f59e0b" />
                <Text style={styles.menuButtonText}>Ghid de accesibilitate</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleAboutApp} activeOpacity={0.7}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="information-circle-outline" size={20} color="#818cf8" />
                <Text style={styles.menuButtonText}>Despre aplicație</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Sectiunea 3: Securitate */}
            <Text style={styles.sectionTitle}>SECURITATE & DATE</Text>

            <TouchableOpacity style={styles.menuButton} onPress={handlePrivacyPolicy} activeOpacity={0.7}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" />
                <Text style={styles.subtleText}>Politică de confidențialitate</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer cu Logout */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={19} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Deconectare cont</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>IncludApp v1.0 • Munăreanț Dan Ioan</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0 ,0 ,0, 0.75)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0f172a',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  userRole: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  subtleText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 14,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  versionText: {
    color: '#475569',
    fontSize: 11,
  },
});