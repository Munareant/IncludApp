import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { HeaderBar } from '../components/HeaderBar';
import { API_BASE_URL } from '../config/api';

interface Message {
  id: string;
  request_id: string;
  sender_id?: string | null;
  message: string;
  is_ai?: boolean;
  created_at: string;
}

interface ChatScreenProps {
  onOpenChat?: () => void;
  activeRequestId: string | null;
  onOpenMenu: () => void;
  onNavigateBack?: () => void;
  currentUserId?: string;
}

const FALLBACK_REQUEST_ID = '00000000-0000-0000-0000-000000000099';
const FALLBACK_USER_ID = '00000000-0000-0000-0000-000000000002';

export const ChatScreen: React.FC<ChatScreenProps> = ({
  activeRequestId,
  onOpenMenu,
  onNavigateBack,
  currentUserId = FALLBACK_USER_ID,
}) => {
  const targetRequestId = activeRequestId || FALLBACK_REQUEST_ID;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const backHandlerRef = useRef(onNavigateBack);
  useEffect(() => {
    backHandlerRef.current = onNavigateBack;
  }, [onNavigateBack]);

const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Glisare spre dreapta: mergem înapoi la Hartă
        if (gestureState.dx > 50 && backHandlerRef.current) {
          backHandlerRef.current();
        }
      },
    })
  ).current;

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/requests/${targetRequestId}/messages`);
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

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_request_chat', { requestId: targetRequestId });

    socket.on(`chat_message_${targetRequestId}`, (newMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      socket.emit('leave_request_chat', { requestId: targetRequestId });
      socket.disconnect();
    };
  }, [targetRequestId]);

  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setInputText('');
    setSending(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/requests/${targetRequestId}/messages`, {
        senderId: currentUserId,
        message: trimmed,
      });

      if (res.data && res.data.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.warn('Eroare la trimiterea mesajului:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.screen} {...panResponder.panHandlers}>
      <HeaderBar title="Mesagerie & Suport AI" onOpenMenu={onOpenMenu} />

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingText}>Se încarcă mesajele...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id || String(Math.random())}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  chatArea: {
    flex: 1,
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
    paddingBottom: 20,
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