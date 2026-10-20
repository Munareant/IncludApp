import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  currentUser: any;
  location: { latitude: number; longitude: number } | null;
  loading: boolean;
  onSendSOS: () => void;
  volunteerPoints: number;
  onOpenMenu: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentUser,
  location,
  loading,
  onSendSOS,
  volunteerPoints,
  onOpenMenu,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={onOpenMenu} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={26} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>IncludApp</Text>
        <View style={styles.spacer} />
      </View>

      {currentUser && (
        <Text style={styles.userGreeting}>
          Salut, {currentUser.fullName || currentUser.full_name || 'Utilizator'}
        </Text>
      )}

      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>⭐ Puncte voluntar: {volunteerPoints}</Text>
      </View>

      {location ? (
        <Text style={styles.coords}>
          GPS: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.coords}>Se caută semnal GPS...</Text>
      )}

      <View style={styles.sosContainer}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={onSendSOS}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.sosText}>SOS</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.sosHint}>Apasă pentru asistență de urgență</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 42,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  userGreeting: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 40,
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
    marginBottom: 24,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sosHint: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 20,
  },
});