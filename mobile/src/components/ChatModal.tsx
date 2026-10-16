import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  currentUserId: string;
  requestTitle?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  requestId,
  currentUserId,
  requestTitle,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible || !requestId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/requests/${requestId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.warn('Eroare istoric mesaje:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_request_chat', { requestId });

    socket.on('receive_message', (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      socket.emit('leave_request_chat', { requestId });
      socket.disconnect();
    };
  }, [visible, requestId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      requestId,
      senderId: currentUserId,
      message: inputText.trim(),
    });

    setInputText('');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>💬 Mesagerie Misiune</Text>
            <Text style={styles.headerSub}>{requestTitle || 'Comunicare directă'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Închide</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#38bdf8" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              const isMine = item.sender_id === currentUserId;
              return (
                <View style={[styles.bubbleContainer, isMine ? styles.myMsgAlign : styles.otherMsgAlign]}>
                  <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.msgText, isMine ? styles.myText : styles.otherText]}>
                      {item.message}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Scrie un mesaj..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.disabledSend]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendText}>Trimite</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#94a3b8', fontSize: 13 },
  closeBtn: { backgroundColor: '#ef4444', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  closeBtnText: { color: '#fff', fontWeight: 'bold' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 16 },
  bubbleContainer: { marginVertical: 4, width: '100%' },
  myMsgAlign: { alignItems: 'flex-end' },
  otherMsgAlign: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 14 },
  myBubble: { backgroundColor: '#0284c7', borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#334155', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 14 },
  myText: { color: '#ffffff' },
  otherText: { color: '#f1f5f9' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  sendButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  disabledSend: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: 'bold' },
});