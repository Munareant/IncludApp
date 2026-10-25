import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type DisabilityType = 'VISUAL' | 'DEAF_MUTE' | 'LOCOMOTOR' | 'GENERAL';

interface Props {
  selectedType: DisabilityType;
  onSelect: (type: DisabilityType) => void;
}

export const DisabilitySelector: React.FC<Props> = ({ selectedType, onSelect }) => {
  const handleSelect = (type: DisabilityType) => {
    // Declanșează un feedback tactil ușor la selecție
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(type);
  };

  return (
    <View style={styles.container}>
      <Text 
        style={styles.label}
        accessible={true}
        accessibilityLabel="Selectează tipul de asistență specifică"
      >
        TIP ASISTENȚĂ SPECIFICĂ
      </Text>

      <View style={styles.cardsRow}>
        {/* Buton Nevăzători */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedType === 'VISUAL' && styles.cardSelectedVisual,
          ]}
          onPress={() => handleSelect('VISUAL')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Asistență pentru persoane nevăzătoare sau cu deficiențe de vedere"
          accessibilityState={{ selected: selectedType === 'VISUAL' }}
        >
          <Ionicons
            name="eye-off-outline"
            size={26}
            color={selectedType === 'VISUAL' ? '#10b981' : '#94a3b8'}
          />
          <Text style={[styles.cardTitle, selectedType === 'VISUAL' && styles.textSelected]}>
            Nevăzător
          </Text>
          <Text style={styles.cardSub}>Audio / Ghidaj</Text>
        </TouchableOpacity>

        {/* Buton Surdo-Muți */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedType === 'DEAF_MUTE' && styles.cardSelectedDeaf,
          ]}
          onPress={() => handleSelect('DEAF_MUTE')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Asistență pentru persoane surdo-mute sau cu deficiențe de auz"
          accessibilityState={{ selected: selectedType === 'DEAF_MUTE' }}
        >
          <Ionicons
            name="hand-left-outline"
            size={26}
            color={selectedType === 'DEAF_MUTE' ? '#38bdf8' : '#94a3b8'}
          />
          <Text style={[styles.cardTitle, selectedType === 'DEAF_MUTE' && styles.textSelected]}>
            Surdo-Mut
          </Text>
          <Text style={styles.cardSub}>Semne / Text</Text>
        </TouchableOpacity>

        {/* Buton Locomotor */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedType === 'LOCOMOTOR' && styles.cardSelectedLoco,
          ]}
          onPress={() => handleSelect('LOCOMOTOR')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Asistență pentru persoane cu deficiențe locomotorii sau utilizatori de scaun rulant"
          accessibilityState={{ selected: selectedType === 'LOCOMOTOR' }}
        >
          <Ionicons
            name="body-outline"
            size={26}
            color={selectedType === 'LOCOMOTOR' ? '#f59e0b' : '#94a3b8'}
          />
          <Text style={[styles.cardTitle, selectedType === 'LOCOMOTOR' && styles.textSelected]}>
            Locomotor
          </Text>
          <Text style={styles.cardSub}>Rampă / Sprijin</Text>
        </TouchableOpacity>
      </View>

      {/* Mesaj contextual pentru robotelul de semne / ghid vizual cand este selectat Surdo-Mut */}
      {selectedType === 'DEAF_MUTE' && (
        <View style={styles.visualHelpBox}>
          <Ionicons name="chatbubbles-outline" size={20} color="#38bdf8" />
          <Text style={styles.visualHelpText}>
            Modul Vizual Activ: Se activează cartonașele cu pictograme rapide de limbaj mimico-gestual și alerte prin flash vizual.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  label: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelectedVisual: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  cardSelectedDeaf: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  cardSelectedLoco: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  cardTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
  },
  textSelected: {
    color: '#ffffff',
  },
  cardSub: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  visualHelpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  visualHelpText: {
    color: '#bae6fd',
    fontSize: 11,
    flex: 1,
  },
});