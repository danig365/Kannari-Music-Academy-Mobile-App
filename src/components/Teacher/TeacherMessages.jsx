import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator, useWindowDimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { API_BASE_URL } from '../../config';
import { getConversation, getDirectConversation, sendMessage, markMessagesRead, markDirectMessagesRead, getChatLockStatus } from '../../services/messagingService';

const TeacherMessages = () => {
  const baseUrl = API_BASE_URL;

  const [teacherId, setTeacherId] = useState(null)
  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({ allowed: true, reason: '' });
  const [chatLock, setChatLock] = useState(null);
  const [parentLinkId, setParentLinkId] = useState(null);
  const [teacherStudentId, setTeacherStudentId] = useState(null);
  const [isDirectChat, setIsDirectChat] = useState(false);
  const [chatPartnerName, setChatPartnerName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatScrollRef = useRef(null);
  const pollRef = useRef(null);
  const conversationIdRef = useRef(null);
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isMobile = width < 768
  const baseComposerInset = isMobile ? Math.max(insets.bottom, 12) : 10
  const composerBottomInset = baseComposerInset + (Platform.OS === 'android' ? keyboardHeight : 0)
  const messagesBottomInset = baseComposerInset + 58

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      const height = event?.endCoordinates?.height || 0;
      setKeyboardHeight(Math.max(height - insets.bottom, 0));
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [insets.bottom]);

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId')
        setTeacherId(id)
      } catch (e) {
        console.log(e)
      }
    }

    getTeacherId()
  }, [])

  useEffect(() => {
    if (teacherId) fetchStudents();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [teacherId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/teacher/students/${teacherId}/`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
    setLoading(false);
  };

  const openStudentChat = async (student) => {
    setActiveStudent(student);
    setMessages([]);
    setChatStatus({ allowed: true, reason: '' });
    setChatLock(null);
    setParentLinkId(null);
    setTeacherStudentId(null);
    setIsDirectChat(false);
    setChatPartnerName('');
    conversationIdRef.current = null;

    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const studentId = student.student?.id || student.student;
      const statusRes = await fetch(`${baseUrl}/student/${studentId}/parent/status/?teacher_id=${teacherId}`);
      const statusData = await statusRes.json();

      const isMinor = statusData.is_minor;

      if (!isMinor && statusData.teacher_student) {
        const tsId = statusData.teacher_student.teacher_student_id;
        setTeacherStudentId(tsId);
        setIsDirectChat(true);
        setChatPartnerName(student.student_name || statusData.teacher_student.student_name || 'Student');
        conversationIdRef.current = tsId;

        const convRes = await getDirectConversation(tsId);
        setMessages(convRes.data.messages || []);
        setChatStatus(convRes.data.chat_status || { allowed: true, reason: '' });
        await markDirectMessagesRead(tsId, 'teacher', teacherId);

        pollRef.current = setInterval(async () => {
          try {
            const res = await getDirectConversation(tsId);
            setMessages(prev => {
              const newMsgs = res.data.messages || [];
              if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
                scrollToBottom()
                markDirectMessagesRead(tsId, 'teacher', teacherId).catch(() => {});
                return newMsgs;
              }
              return prev;
            });
          } catch (e) { }
        }, 5000);

      } else if (statusData.parent_link_id) {
        const linkId = statusData.parent_link_id;
        setParentLinkId(linkId);
        setIsDirectChat(false);
        setChatPartnerName(statusData.parent_name || 'Parent');
        conversationIdRef.current = linkId;

        const convRes = await getConversation(linkId);
        setMessages(convRes.data.messages || []);
        setChatStatus(convRes.data.chat_status || { allowed: true, reason: '' });
        await markMessagesRead(linkId, 'teacher', teacherId);

        try {
          const lockRes = await getChatLockStatus(linkId);
          setChatLock(lockRes.data);
        } catch (e) { }

        pollRef.current = setInterval(async () => {
          try {
            const res = await getConversation(linkId);
            setMessages(prev => {
              const newMsgs = res.data.messages || [];
              if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
                scrollToBottom()
                markMessagesRead(linkId, 'teacher', teacherId).catch(() => {});
                return newMsgs;
              }
              return prev;
            });
            setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
          } catch (e) { }
        }, 5000);

      } else {
        setChatStatus({ allowed: false, reason: isMinor ? 'No parent account linked to this student' : 'No teacher-student assignment found' });
      }
    } catch (err) {
      console.error('Error opening chat:', err);
    }
    scrollToBottom()
  };

  const handleSend = async () => {
    const canSend = isDirectChat ? !!teacherStudentId : !!parentLinkId;
    if (!newMessage.trim() || !canSend) return;
    setSending(true);
    try {
      const payload = {
        sender_type: 'teacher',
        sender_id: teacherId,
        content: newMessage.trim(),
      };

      if (isDirectChat) {
        payload.recipient_type = 'student';
        payload.recipient_id = activeStudent.student?.id || activeStudent.student;
        payload.teacher_student_id = teacherStudentId;
      } else {
        payload.recipient_type = 'parent';
        payload.parent_link_id = parentLinkId;
      }

      await sendMessage(payload);
      setNewMessage('');

      if (isDirectChat) {
        const res = await getDirectConversation(teacherStudentId);
        setMessages(res.data.messages || []);
      } else {
        const res = await getConversation(parentLinkId);
        setMessages(res.data.messages || []);
      }
      scrollToBottom()
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send message');
    }
    setSending(false);
  };

  const timeAgo = (dateStr) => {
    const now = new Date(); const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const conversationReady = isDirectChat ? !!teacherStudentId : !!parentLinkId;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
      <View style={styles.root}>
      {(!isMobile || !activeStudent) && (
        <View style={[styles.listPanel, isMobile ? styles.listPanelMobile : null]}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>💬 Text Messages</Text>
            <Text style={styles.listSubtitle}>Chat with parents & adult students</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingTop: 6, paddingBottom: 8 }}>
            {loading ? (
              <View style={styles.centerBox}><Text style={styles.mutedText}>Loading students...</Text></View>
            ) : students.length === 0 ? (
              <View style={styles.centerBox}><Text style={styles.lightText}>No students found</Text></View>
            ) : (
              students.map(s => (
                <TouchableOpacity key={s.id} onPress={() => openStudentChat(s)} style={[styles.studentItem, activeStudent?.id === s.id ? styles.studentItemActive : null]}>
                  <View style={styles.studentRow}>
                    {s.student_profile_img ? (
                      <Image source={{ uri: s.student_profile_img }} style={styles.studentAvatar} />
                    ) : (
                      <View style={styles.studentAvatarFallback}>
                        <Text style={styles.studentAvatarFallbackText}>{(s.student_name || 'S').substring(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.studentName}>{s.student_name}</Text>
                      <Text style={styles.studentMeta}>{s.instrument} • {s.level}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {(!isMobile || activeStudent) && (
        <View style={styles.chatPanel}>
          {!activeStudent ? (
            <View style={styles.placeholderWrap}>
              <Text style={styles.placeholderIcon}>🗨️</Text>
              <Text style={styles.placeholderText}>Select a student to start messaging</Text>
            </View>
          ) : (
            <>
              <View style={styles.chatHeader}>
                {isMobile && (
                  <TouchableOpacity onPress={() => setActiveStudent(null)} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.flexOne}>
                  <Text style={styles.chatHeaderTitle}>{activeStudent.student_name}</Text>
                  <View style={styles.chatHeaderMetaRow}>
                    {isDirectChat && <Text style={styles.directBadge}>Direct (18+)</Text>}
                    {!isDirectChat && !!chatPartnerName && <Text style={styles.viaText}>via {chatPartnerName}</Text>}
                    {!chatStatus.allowed && <Text style={styles.lockText}>{chatStatus.reason}</Text>}
                  </View>
                </View>
                {!isDirectChat && chatLock && (
                  <View style={[styles.lockBadge, !chatLock.chat_allowed ? styles.lockedBadge : styles.unlockedBadge]}>
                    <Text style={[styles.lockBadgeText, !chatLock.chat_allowed ? styles.lockedText : styles.unlockedText]}>
                      {!chatLock.chat_allowed ? 'Chat Locked' : 'Chat Open'}
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView
                ref={chatScrollRef}
                contentContainerStyle={[styles.messagesWrap, { paddingBottom: messagesBottomInset }]}
                keyboardShouldPersistTaps='handled'
                onContentSizeChange={scrollToBottom}
              >
                {messages.length === 0 ? (
                  <View style={styles.centerBox}>
                    <Text style={styles.lightText}>{conversationReady ? 'No messages yet — start the conversation!' : 'Messaging unavailable'}</Text>
                  </View>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_type === 'teacher' && String(msg.sender_teacher) === String(teacherId);
                    return (
                      <View key={msg.id} style={[styles.messageRow, isMine ? styles.messageRight : styles.messageLeft]}>
                        <View style={[styles.messageBubble, isMine ? styles.messageMine : styles.messageOther]}>
                          {!isMine && <Text style={styles.senderText}>{msg.sender_display}</Text>}
                          <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextOther]}>{msg.content}</Text>
                          <Text style={[styles.timeText, isMine ? styles.timeMine : styles.timeOther]}>{timeAgo(msg.created_at)}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {chatStatus.allowed && conversationReady ? (
                <View style={[styles.inputRow, { paddingBottom: composerBottomInset }]}>
                  <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder='Type a message...'
                    multiline={true}
                    style={styles.input}
                  />
                  <TouchableOpacity onPress={handleSend} disabled={!newMessage.trim() || sending} style={[styles.sendBtn, !newMessage.trim() || sending ? styles.sendDisabled : null]}>
                    {sending ? <ActivityIndicator color='#fff' size='small' /> : <Text style={styles.sendBtnText}>➤</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.unavailableBox, { paddingBottom: composerBottomInset }]}>
                  <Text style={styles.unavailableText}>{chatStatus.reason || 'Messaging unavailable'}</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  listPanel: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  listPanelMobile: {
    width: '100%',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  listTitle: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 16,
  },
  listSubtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  mutedText: {
    color: '#64748b',
  },
  lightText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  studentItem: {
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  studentItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  studentAvatarFallback: {
    width: 44,
    height: 44,
    backgroundColor: '#6366f1',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarFallbackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  studentName: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 14,
  },
  studentMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  chatPanel: {
    flex: 1,
    backgroundColor: '#f8fafc',
    minHeight: 0,
  },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 56,
    color: '#cbd5e1',
  },
  placeholderText: {
    color: '#64748b',
    marginTop: 12,
  },
  chatHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 18,
    color: '#1e293b',
  },
  flexOne: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
  },
  chatHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  directBadge: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '500',
  },
  viaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  lockText: {
    color: '#ef4444',
    fontSize: 11,
  },
  lockBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  lockedBadge: {
    backgroundColor: '#fef3c7',
  },
  unlockedBadge: {
    backgroundColor: '#d1fae5',
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lockedText: {
    color: '#92400e',
  },
  unlockedText: {
    color: '#065f46',
  },
  messagesWrap: {
    padding: 16,
    gap: 8,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageLeft: {
    justifyContent: 'flex-start',
  },
  messageRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  messageMine: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
    backgroundColor: '#6366f1',
  },
  messageOther: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  senderText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
  },
  messageTextMine: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#1e293b',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  timeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeOther: {
    color: '#94a3b8',
  },
  inputRow: {
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 80,
    backgroundColor: '#fff',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: '#e2e8f0',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  unavailableBox: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
})

export default TeacherMessages;
