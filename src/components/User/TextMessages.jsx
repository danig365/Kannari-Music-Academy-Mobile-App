import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL, SITE_URL } from '../../config';
import {
  getDirectConversation,
  sendMessage,
  markDirectMessagesRead,
  getStudentTeacherConversations,
} from '../../services/messagingService';

const baseUrl = API_BASE_URL;
const POLL_INTERVAL = 5000;

const TextMessages = () => {
  const insets = useSafeAreaInsets();
  const [studentId, setStudentId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({ allowed: true, reason: '' });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);
  const [accessError, setAccessError] = useState(null);
  const composerBottomInset = Math.max(insets.bottom, 12);

  const pollRef = useRef(null);
  const messageScrollRef = useRef(null);

  useEffect(() => {
    const loadStudentId = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        setStudentId(storedStudentId);
      } catch (error) {
        console.log('Failed to load student id:', error);
      }
    };

    loadStudentId();
  }, []);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/minor-access-status/`);
        if (res.data?.is_minor) {
          setAccessError('Direct teacher messaging is only available for students 18 and older.');
          setLoading(false);
          return;
        }
      } catch {
        // Continue if endpoint is unavailable
      }

      await fetchConversations(studentId);
    };

    checkAccessAndFetch();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [studentId]);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      messageScrollRef.current?.scrollToEnd({ animated });
    }, 120);
  };

  const fetchConversations = async (id = studentId) => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await getStudentTeacherConversations(id);
      setConversations(res.data?.conversations || []);
    } catch (err) {
      console.log('Error fetching conversations:', err);
      if (err.response?.status === 403) {
        setAccessError(err.response?.data?.error || 'Access denied');
      }
    }
    setLoading(false);
  };

  const openConversation = async (conv) => {
    if (!studentId) return;

    setActiveConv(conv);
    setMessages([]);
    setChatStatus({ allowed: true, reason: '' });

    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const res = await getDirectConversation(conv.teacher_student_id);
      const nextMessages = res.data?.messages || [];
      setMessages(nextMessages);
      setChatStatus(res.data?.chat_status || { allowed: true, reason: '' });
      await markDirectMessagesRead(conv.teacher_student_id, 'student', studentId);
      scrollToBottom(false);
    } catch (err) {
      console.log('Error loading conversation:', err);
      if (err.response?.data?.error) {
        setChatStatus({ allowed: false, reason: err.response.data.error });
      }
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await getDirectConversation(conv.teacher_student_id);
        setMessages((prev) => {
          const nextMessages = res.data?.messages || [];
          const changed =
            nextMessages.length !== prev.length ||
            (nextMessages.length > 0 &&
              nextMessages[nextMessages.length - 1]?.id !== prev[prev.length - 1]?.id);

          if (changed) {
            scrollToBottom(true);
            markDirectMessagesRead(conv.teacher_student_id, 'student', studentId).catch(() => {});
            return nextMessages;
          }
          return prev;
        });
      } catch {
        // silent polling failure
      }
    }, POLL_INTERVAL);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || sending || !studentId) return;

    setSending(true);
    try {
      await sendMessage({
        sender_type: 'student',
        sender_id: studentId,
        recipient_type: 'teacher',
        recipient_id: activeConv.teacher_id,
        content: newMessage.trim(),
        teacher_student_id: activeConv.teacher_student_id,
      });

      setNewMessage('');
      const res = await getDirectConversation(activeConv.teacher_student_id);
      setMessages(res.data?.messages || []);
      scrollToBottom(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send message';
      Alert.alert('Message not sent', errMsg);
    }

    setSending(false);
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTeacherAvatar = (conv, size = 42) => {
    const imgRaw = conv?.teacher_profile_img || conv?.teacher_profile_image || conv?.profile_img || conv?.profile_image || null;
    const imgUri = imgRaw
      ? (imgRaw.startsWith('http') ? imgRaw : `${SITE_URL}${imgRaw.startsWith('/') ? '' : '/'}${imgRaw}`)
      : null;

    if (imgUri) {
      return <Image source={{ uri: imgUri }} style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]} />;
    }

    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarInitials, { fontSize: size > 40 ? 14 : 12 }]}>
          {(conv?.teacher_name || 'T').substring(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <>
      {accessError ? (
          <View style={styles.accessBlockedWrap}>
            <Bootstrap name="shield-lock-fill" size={56} color="#f59e0b" />
            <Text style={styles.accessBlockedText}>{accessError}</Text>
          </View>
        ) : (
          <View style={styles.mainPanels}>
            {(!isMobile || !activeConv) && (
              <View style={[styles.leftPanel, isMobile ? styles.leftPanelMobile : null]}>
                <View style={styles.leftPanelHeader}>
                  <View style={styles.leftPanelTitleRow}>
                    <Bootstrap name="chat-dots" size={18} color="#1e293b" />
                    <Text style={styles.leftPanelTitle}>Text Messages</Text>
                  </View>
                  <Text style={styles.leftPanelSubtitle}>Chat with your teachers</Text>
                </View>

                <ScrollView style={styles.listScroll}>
                  {loading ? (
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator size="small" color="#3b82f6" />
                      <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                  ) : conversations.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Bootstrap name="chat-left-text" size={40} color="#cbd5e1" />
                      <Text style={styles.emptyTitle}>No teacher conversations</Text>
                      <Text style={styles.emptySubtitle}>You'll see your teachers here once assigned</Text>
                    </View>
                  ) : (
                    conversations.map((conv) => (
                      <TouchableOpacity
                        key={conv.teacher_student_id}
                        onPress={() => openConversation(conv)}
                        style={[
                          styles.conversationItem,
                          activeConv?.teacher_student_id === conv.teacher_student_id && styles.conversationItemActive,
                        ]}
                      >
                        <View style={styles.conversationRow}>
                          {renderTeacherAvatar(conv, 42)}

                          <View style={styles.conversationMeta}>
                            <Text style={styles.teacherName}>{conv.teacher_name}</Text>
                            <Text style={styles.teacherRole}>Teacher</Text>
                          </View>

                          {conv.unread_count > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadBadgeText}>{conv.unread_count}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {(!isMobile || activeConv) && (
              <KeyboardAvoidingView
                style={styles.rightPanel}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
              >
                {!activeConv ? (
                  <View style={styles.emptyChatWrap}>
                    <Bootstrap name="chat-square-text" size={64} color="#cbd5e1" />
                    <Text style={styles.emptyChatText}>Select a teacher to start messaging</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.chatHeader}>
                      {isMobile && (
                        <TouchableOpacity onPress={() => setActiveConv(null)} style={styles.backBtn}>
                          <Bootstrap name="arrow-left" size={20} color="#64748b" />
                        </TouchableOpacity>
                      )}

                      {renderTeacherAvatar(activeConv, 36)}

                      <View style={styles.chatHeaderMeta}>
                        <Text style={styles.chatTeacherName}>{activeConv.teacher_name}</Text>
                        <Text style={[styles.chatStatus, { color: chatStatus.allowed ? '#10b981' : '#ef4444' }]}>
                          {chatStatus.allowed ? 'Chat available' : chatStatus.reason}
                        </Text>
                      </View>
                    </View>

                    <ScrollView
                      ref={messageScrollRef}
                      style={styles.messagesScroll}
                      contentContainerStyle={[styles.messagesContent, { paddingBottom: composerBottomInset }]}
                      onContentSizeChange={() => scrollToBottom(false)}
                      keyboardShouldPersistTaps="handled"
                    >
                      {messages.length === 0 ? (
                        <View style={styles.noMessagesWrap}>
                          <Text style={styles.noMessagesText}>No messages yet — start the conversation!</Text>
                        </View>
                      ) : (
                        messages.map((msg) => {
                          const isMine = msg.sender_type === 'student' && String(msg.sender_student) === String(studentId);

                          return (
                            <View
                              key={msg.id}
                              style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}
                            >
                              <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                                {!isMine && <Text style={styles.senderDisplay}>{msg.sender_display}</Text>}

                                <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextOther]}>
                                  {msg.content}
                                </Text>

                                <View style={styles.messageTimeRow}>
                                  <Text style={[styles.messageTime, isMine ? styles.messageTimeMine : styles.messageTimeOther]}>
                                    {timeAgo(msg.created_at)}
                                  </Text>
                                  {isMine && msg.is_read && <Text style={styles.readTicks}>✓✓</Text>}
                                </View>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </ScrollView>

                    {!chatStatus.allowed ? (
                      <View style={[styles.lockedBar, { paddingBottom: composerBottomInset }]}>
                        <Bootstrap name="lock" size={14} color="#ef4444" />
                        <Text style={styles.lockedBarText}>{chatStatus.reason}</Text>
                      </View>
                    ) : (
                      <View style={[styles.inputBar, { paddingBottom: composerBottomInset }]}>
                        <TextInput
                          value={newMessage}
                          onChangeText={setNewMessage}
                          placeholder="Type a message..."
                          multiline
                          style={styles.input}
                          textAlignVertical="top"
                        />

                        <TouchableOpacity
                          onPress={handleSend}
                          disabled={!newMessage.trim() || sending}
                          style={[
                            styles.sendBtn,
                            newMessage.trim() ? styles.sendBtnActive : styles.sendBtnDisabled,
                          ]}
                        >
                          {sending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Bootstrap name="send-fill" size={15} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </KeyboardAvoidingView>
            )}
          </View>
        )}
    </>
  );
};

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  contentWrap: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  sidebarToggle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.08)',
    marginRight: 10,
  },
  logoMini: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  accessBlockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  accessBlockedText: {
    marginTop: 16,
    color: '#92400e',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  mainPanels: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  leftPanel: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  leftPanelMobile: {
    flex: 1,
    width: '100%',
    borderRightWidth: 0,
  },
  leftPanelHeader: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  leftPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leftPanelTitle: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 18,
  },
  leftPanelSubtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  listScroll: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 8,
  },
  loadingWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyWrap: {
    padding: 34,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  emptySubtitle: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  conversationItem: {
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  conversationItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarFallback: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontWeight: '600',
  },
  conversationMeta: {
    flex: 1,
  },
  teacherName: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 14,
  },
  teacherRole: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyChatWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChatText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
  },
  chatHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderMeta: {
    flex: 1,
  },
  chatTeacherName: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
  },
  chatStatus: {
    marginTop: 2,
    fontSize: 11,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 8,
  },
  noMessagesWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noMessagesText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleMine: {
    borderTopRightRadius: 4,
    backgroundColor: '#3b82f6',
  },
  messageBubbleOther: {
    borderTopLeftRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  senderDisplay: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#ffffff',
  },
  messageTextOther: {
    color: '#1e293b',
  },
  messageTimeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  messageTimeOther: {
    color: '#94a3b8',
  },
  readTicks: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  lockedBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fef2f2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedBarText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#ffffff',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#3b82f6',
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
});

export default TextMessages;
