import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface SideDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onLogout: () => void;
}

export const SideDrawerModal: React.FC<SideDrawerModalProps> = ({
  visible,
  onClose,
  currentUser,
  onLogout,
}) => {
  // Stare internă pentru a ține Modal-ul deschis până se termină animația de închidere
  const [modalVisible, setModalVisible] = useState(visible);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      // Deschidere sincronizată: fundalul se întunecă treptat, meniul glisează elastic
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 170,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Închidere fluidă: meniul se retrage complet în stânga înainte de a ascunde modalul
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleAction = (title: string) => {
    onClose();
    setTimeout(() => {
      Alert.alert(title, `Secțiunea "${title}" este pregătită pentru configurare.`);
    }, 280);
  };

  const initialLetter = currentUser?.fullName
    ? currentUser.fullName.charAt(0).toUpperCase()
    : 'U';

  const userDisplayName = currentUser?.fullName || currentUser?.full_name || 'Utilizator';
  const userDisplayRole = currentUser?.role === 'BENEFICIARY' ? 'Beneficiar' : 'Voluntar Comunitar';

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Fundal fumuriu animat (Fade In / Fade Out) */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Panoul lateral animat cu glisare din afara ecranului */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Antet Profil */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialLetter}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {userDisplayName}
            </Text>
            <Text style={styles.userRole}>
              {userDisplayRole}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Secțiunea Comunități */}
            <Text style={styles.sectionHeader}>COMUNITATE</Text>

            <TouchableOpacity
              style={styles.actionCardHighlight}
              onPress={() => handleAction('Creare Comunitate')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={22} color="#10b981" />
              <Text style={styles.actionTextHighlight}>Creează Comunitate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction('Comunitățile mele')}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={20} color="#94a3b8" />
              <Text style={styles.menuText}>Comunitățile Mele</Text>
            </TouchableOpacity>

            {/* Secțiunea Suport & Urgență */}
            <Text style={styles.sectionHeader}>SUPORT & ASISTENȚĂ</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction('Ghid SOS')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" />
              <Text style={styles.menuText}>Ghid SOS & Prim Ajutor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction('Numere de Urgență')}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#94a3b8" />
              <Text style={styles.menuText}>Numere de Urgență (112)</Text>
            </TouchableOpacity>

            {/* Secțiunea Setări */}
            <Text style={styles.sectionHeader}>PREFERINȚE</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction('Setări')}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color="#94a3b8" />
              <Text style={styles.menuText}>Setări Aplicație</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction('Despre')}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={20} color="#94a3b8" />
              <Text style={styles.menuText}>Despre IncludApp</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Subsol Drawer */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                onClose();
                onLogout();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Deconectare cont</Text>
            </TouchableOpacity>
            <Text style={styles.footerBrand}>v1.0 • Munăreanț Dan Ioan</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#0c1322',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 54,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
    fontWeight: '600',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  actionCardHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  actionTextHighlight: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  menuText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  footerBrand: {
    fontSize: 11,
    color: '#475569',
    marginTop: 12,
  },
});