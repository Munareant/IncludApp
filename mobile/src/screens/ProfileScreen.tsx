import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, PanResponder } from 'react-native';
import { HeaderBar } from '../components/HeaderBar';

interface ProfileScreenProps {
  currentUser: any;
  volunteerPoints: number;
  onLogout: () => void;
  onOpenMenu: () => void;
  onNavigateBack?: () => void; // Swipe dreapta -> Chat
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  volunteerPoints,
  onLogout,
  onOpenMenu,
  onNavigateBack,
}) => {
  // Pastram callback-ul intr-un ref sincronizat
  const backHandlerRef = useRef(onNavigateBack);
  useEffect(() => {
    backHandlerRef.current = onNavigateBack;
  }, [onNavigateBack]);

  // Gest swipe spre dreapta (dx > 70)
const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Glisare spre dreapta: mergem înapoi la Chat
        if (gestureState.dx > 50 && backHandlerRef.current) {
          backHandlerRef.current();
        }
      },
    })
  ).current;

  return (
    <View style={styles.screen} {...panResponder.panHandlers}>
      <HeaderBar title="Profil Utilizator" onOpenMenu={onOpenMenu} />

      <View style={styles.content}>
        {/* Avatar Placeholder */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
          </Text>
        </View>

        <Text style={styles.userName}>
          {currentUser?.fullName || currentUser?.full_name || 'Utilizator'}
        </Text>
        <Text style={styles.userRole}>
          Rol: {currentUser?.role === 'BENEFICIARY' ? 'Beneficiar' : 'Voluntar'}
        </Text>
        <Text style={styles.userEmail}>{currentUser?.email || 'email@exemplu.com'}</Text>

        {/* Card Punctaj */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Total puncte voluntar</Text>
          <Text style={styles.statsValue}>⭐ {volunteerPoints}</Text>
        </View>

        {/* Buton Deconectare */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Deconectare cont</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 28,
  },
  statsCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    maxWidth: 280,
  },
  statsLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
  },
  statsValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});