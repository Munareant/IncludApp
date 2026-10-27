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
  sender_id?: string | null;
  message: string;
  is_ai?: boolean;
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
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible || !requestId) return;

    // 1. Preluare istoric mesaje din baza de date
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/requests/${requestId}/messages`);
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      } catch (err) {
        console.warn('Eroare istoric mesaje:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // 2. Conectare la canalul de mesagerie prin Socket.io
    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_request_chat', { requestId });

    // Ascultă ambele formate uzuale de emitere pentru mesaje noi
    socket.on('receive_message', (newMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    socket.on(`chat_message_${requestId}`, (newMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      socket.emit('leave_request_chat', { requestId });
      socket.disconnect();
    };
  }, [visible, requestId]);

  // 3. Trimitere mesaj atât prin POST HTTP (persistență DB + trigger AI), cât și prin Socket
  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setInputText('');
    setSending(true);

    try {
      // Salvează direct în backend (care va declanșa și AI-ul)
      const res = await axios.post(`${API_BASE_URL}/api/requests/${requestId}/messages`, {
        senderId: currentUserId,
        message: trimmed,
      });

      // Adaugă local mesajul trimis dacă nu a venit deja prin socket
      if (res.data && res.data.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }

      // Notificare adițională prin socket
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          requestId,
          senderId: currentUserId,
          message: trimmed,
        });
      }
    } catch (err) {
      console.warn('Eroare la trimiterea mesajului:', err);
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Chat */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>💬 Mesagerie & Suport AI</Text>
            <Text style={styles.headerSub}>{requestTitle || 'Canal securizat activ'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>Închide</Text>
          </TouchableOpacity>
        </View>

        {/* Zona Mesaje */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingText}>Se încarcă conversația...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id || String(Math.random())}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              // 1. Randare Mesaj de la Asistentul Virtual (AI)
              if (item.is_ai || item.sender_id === null || item.message.startsWith('[IncludApp AI]')) {
                return (
                  <View style={[styles.bubbleContainer, styles.aiMsgAlign]}>
                    <View style={styles.aiBubble}>
                      <View style={styles.aiBadgeRow}>
                        <Text style={styles.aiBadgeText}>🤖 ASISTENT VIRTUAL INCLUDAPP</Text>
                      </View>
                      <Text style={styles.aiText}>{item.message}</Text>
                      <Text style={styles.aiTimeText}>
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                );
              }

              // 2. Randare Mesaj Utilizator Curent vs Altcineva (Voluntar / Beneficiar)
              const isMine = item.sender_id === currentUserId;
              return (
                <View style={[styles.bubbleContainer, isMine ? styles.myMsgAlign : styles.otherMsgAlign]}>
                  <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.msgText, isMine ? styles.myText : styles.otherText]}>
                      {item.message}
                    </Text>
                    <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.otherTimeText]}>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Scrie un mesaj sau întreabă AI-ul..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.disabledSend]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendText}>Trimite</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#111827',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 10,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleContainer: {
    marginVertical: 5,
    width: '100%',
  },
  myMsgAlign: {
    alignItems: 'flex-end',
  },
  otherMsgAlign: {
    alignItems: 'flex-start',
  },
  aiMsgAlign: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 3,
  },
  otherBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  aiBubble: {
    maxWidth: '85%',
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderRadius: 16,
    borderBottomLeftRadius: 3,
    padding: 12,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  aiBadgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aiText: {
    color: '#e0e7ff',
    fontSize: 14,
    lineHeight: 20,
  },
  aiTimeText: {
    color: '#6366f1',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myText: {
    color: '#ffffff',
  },
  otherText: {
    color: '#f1f5f9',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#64748b',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 10,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSend: {
    opacity: 0.4,
  },
  sendText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});