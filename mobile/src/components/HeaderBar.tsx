import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderBarProps {
  title: string;
  onOpenMenu: () => void;
  rightElement?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, onOpenMenu, rightElement }) => {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onOpenMenu}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Deschide meniul lateral"
      >
        <Ionicons name="menu-outline" size={26} color="#ffffff" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <View style={styles.rightSlot}>
        {rightElement || <View style={styles.spacer} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    width: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d',
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
  rightSlot: {
    width: 42,
    alignItems: 'flex-end',
  },
  spacer: {
    width: 42,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
});