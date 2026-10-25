import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SideDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  volunteerPoints: number;
  onLogout: () => void;
}

export const SideDrawerModal: React.FC<SideDrawerModalProps> = ({
  visible,
  onClose,
  currentUser,
  volunteerPoints,
  onLogout,
}) => {
  const [highContrast, setHighContrast] = React.useState(false);
  const [voiceAssist, setVoiceAssist] = React.useState(false);

  const initialLetter = currentUser?.fullName
    ? currentUser.fullName.charAt(0).toUpperCase()
    : 'U';

  const showAboutDialog = () => {
    Alert.alert(
      'Despre IncludApp',
      'IncludApp v1.0.0\nPlatformă Smart City pentru asistență comunitară în timp real.\n\nProiect de Licență 2026',
      [{ text: 'Închide', style: 'cancel' }]
    );
  };

  const showGuideDialog = () => {
    Alert.alert(
      'Ghid Utilizare & QR',
      '1. Beneficiarul emite o alertă SOS cu locația GPS.\n2. Voluntarul din apropiere preia cererea.\n3. La întâlnire, voluntarul scanează codul QR de pe telefonul beneficiarului.\n4. Misiunea este validată instant (+50 puncte).',
      [{ text: 'Am înțeles', style: 'default' }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Fundal întunecat pentru închidere la tap exterior */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Panoul lateral */}
        <View style={styles.drawerContainer}>
          {/* Header profil în sertar */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialLetter}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser?.fullName || currentUser?.full_name || 'Utilizator'}
              </Text>
              <Text style={styles.userRole}>
                {currentUser?.role === 'BENEFICIARY' ? 'Beneficiar' : 'Voluntar Activ'}
              </Text>
              <Text style={styles.pointsBadge}>⭐ {volunteerPoints} puncte</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {/* Secțiunea: Accesibilitate */}
            <Text style={styles.sectionTitle}>ACCESIBILITATE & ASISTENȚĂ</Text>
            
            <View style={styles.menuItemRow}>
              <View style={styles.iconWithText}>
                <Ionicons name="contrast-outline" size={20} color="#10b981" />
                <Text style={styles.menuItemText}>Contrast Ridicat</Text>
              </View>
              <Switch
                value={highContrast}
                onValueChange={setHighContrast}
                thumbColor={highContrast ? '#10b981' : '#64748b'}
                trackColor={{ false: '#1e293b', true: '#064e3b' }}
              />
            </View>

            <View style={styles.menuItemRow}>
              <View style={styles.iconWithText}>
                <Ionicons name="volume-high-outline" size={20} color="#10b981" />
                <Text style={styles.menuItemText}>Ghidare Vocală (TalkBack)</Text>
              </View>
              <Switch
                value={voiceAssist}
                onValueChange={setVoiceAssist}
                thumbColor={voiceAssist ? '#10b981' : '#64748b'}
                trackColor={{ false: '#1e293b', true: '#064e3b' }}
              />
            </View>

            <View style={styles.divider} />

            {/* Secțiunea: Siguranță & Ghid */}
            <Text style={styles.sectionTitle}>SIGURANȚĂ & GHID</Text>

            <TouchableOpacity style={styles.menuButton} onPress={showGuideDialog}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#38bdf8" />
              <Text style={styles.menuButtonText}>Cum funcționează codul QR</Text>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => Alert.alert('Urgență 112', 'În caz de pericol iminent, apelați direct numărul unic de urgență 112.')}
            >
              <Ionicons name="call-outline" size={20} color="#ef4444" />
              <Text style={[styles.menuButtonText, { color: '#fca5a5' }]}>Apel Direct 112</Text>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Secțiunea: Proiect & Licență */}
            <Text style={styles.sectionTitle}>DESPRE APLICAȚIE</Text>

            <TouchableOpacity style={styles.menuButton} onPress={showAboutDialog}>
              <Ionicons name="information-circle-outline" size={20} color="#a855f7" />
              <Text style={styles.menuButtonText}>Despre IncludApp (Licență 2026)</Text>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => Alert.alert('Confidențialitate', 'Datele de localizare sunt utilizate strict pe durata cererilor active conform GDPR.')}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
              <Text style={styles.menuButtonText}>Confidențialitate & GDPR</Text>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer cu Logout */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Deconectare cont</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#0b1329',
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 2,
  },
  pointsBadge: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  menuScroll: {
    flex: 1,
    marginVertical: 15,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 15,
    marginBottom: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuButtonText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});