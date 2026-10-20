import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface MapScreenProps {
  onOpenMap: () => void;
  onOpenScanner: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ onOpenMap, onOpenScanner }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hartă & Intervenții</Text>
      <Text style={styles.subtitle}>Găsește cereri de asistență active sau validează o misiune</Text>

      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: '#0284c7' }]}
        onPress={onOpenMap}
      >
        <Text style={styles.btnText}>🗺️ Deschide harta cererilor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: '#10b981', marginTop: 16 }]}
        onPress={onOpenScanner}
      >
        <Text style={styles.btnText}>📷 Scanează cod QR misiune</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 36,
  },
  actionBtn: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});