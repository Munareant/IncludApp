import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface ChatScreenProps {
  onOpenChat: () => void;
  activeRequestId: string | null;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onOpenChat, activeRequestId }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mesagerie Misiune</Text>
      <Text style={styles.subtitle}>
        {activeRequestId
          ? 'Ai o misiune activă în derulare!'
          : 'Canal de comunicare securizat în timp real cu beneficiarul sau voluntarul.'}
      </Text>

      <TouchableOpacity
        style={[styles.chatBtn, { backgroundColor: '#6366f1' }]}
        onPress={onOpenChat}
        activeOpacity={0.8}
      >
        <Text style={styles.chatBtnText}>💬 Intră în Chat</Text>
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
    lineHeight: 20,
  },
  chatBtn: {
    width: '100%',
    maxWidth: 260,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});