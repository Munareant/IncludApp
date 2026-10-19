import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

interface AuthModalProps {
  visible: boolean;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'BENEFICIARY' | 'VOLUNTEER'>('VOLUNTEER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eroare', 'Completează emailul și parola.');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert('Eroare', 'Introdu numele complet.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { fullName, email, password, phone, role };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ceva nu a funcționat.');
      }

      // Salvăm tokenul și datele utilizatorului local
      await SecureStore.setItemAsync('user_token', data.token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));

      Alert.alert('Succes', isLogin ? 'Bine ai revenit!' : 'Cont creat cu succes!');
      onAuthSuccess(data.user);
    } catch (err: any) {
      Alert.alert('Eroare autentificare', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{isLogin ? 'Autentificare' : 'Creare Cont'}</Text>
          <Text style={styles.subtitle}>IncludApp — Asistență Comunitară</Text>

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nume și prenume"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="Telefon (opțional)"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'VOLUNTEER' && styles.roleBtnActive]}
                  onPress={() => setRole('VOLUNTEER')}
                >
                  <Text style={[styles.roleText, role === 'VOLUNTEER' && styles.roleTextActive]}>
                    Voluntar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'BENEFICIARY' && styles.roleBtnActive]}
                  onPress={() => setRole('BENEFICIARY')}
                >
                  <Text style={[styles.roleText, role === 'BENEFICIARY' && styles.roleTextActive]}>
                    Beneficiar
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Parolă"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>{isLogin ? 'Intră în cont' : 'Înregistrează-te'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? 'Nu ai cont? Înregistrează-te aici' : 'Ai deja cont? Autentifică-te'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scroll: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 30, marginTop: 4 },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  roleText: { color: '#888', fontWeight: 'bold' },
  roleTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#60A5FA', fontSize: 14 },
});