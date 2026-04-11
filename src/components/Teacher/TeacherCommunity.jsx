import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherCommunity = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [teacherId, setTeacherId] = useState(null);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeActionMessageId, setActiveActionMessageId] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const chatScrollRef = useRef(null);

  useEffect(() => {
    const getIdentity = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId');
        const name = await AsyncStorage.getItem('teacherName');
        setTeacherId(id);
        setTeacherName(name || 'Teacher');
      } catch (err) {
        console.log(err);
      }
    };

    getIdentity();
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher-community/messages/`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch community messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (!activeActionMessageId) return;
    const stillExists = messages.some((msg) => msg.id === activeActionMessageId);
    if (!stillExists) {
      setActiveActionMessageId(null);
    }
  }, [messages, activeActionMessageId]);

  const onMessagesSizeChange = () => {
    if (autoScroll) {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setAutoScroll(distanceFromBottom < 100);

    if (isMobile && activeActionMessageId) {
      setActiveActionMessageId(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !teacherId) return;

    setSending(true);
    try {
      await axios.post(`${baseUrl}/teacher-community/messages/`, {
        teacher: parseInt(teacherId, 10),
        content: newMessage.trim(),
      });

      setNewMessage('');
      setShowEmojiPicker(false);
      setActiveActionMessageId(null);
      setAutoScroll(true);
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const togglePin = async (msgId) => {
    try {
      await axios.post(`${baseUrl}/teacher-community/message/${msgId}/toggle-pin/`);
      await fetchMessages();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const hideMessage = async (msgId) => {
    try {
      await axios.post(`${baseUrl}/teacher-community/message/${msgId}/hide/`);
      await fetchMessages();
    } catch (err) {
      console.error('Failed to hide message:', err);
    }
  };

  const confirmHide = (msgId) => {
    Alert.alert('Delete message?', 'This will hide your message from the community.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => hideMessage(msgId) },
    ]);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateName = (name, maxLength = 20) => {
    if (!name) return 'Teacher';
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  const addEmoji = (emoji) => {
    setNewMessage((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const toggleMessageActions = (msgId) => {
    setActiveActionMessageId((prev) => (prev === msgId ? null : msgId));
  };

  const teacherColors = [
    ['#4285f4', '#3b5998'],
    ['#8b5cf6', '#7c3aed'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#ec4899', '#db2777'],
    ['#06b6d4', '#0891b2'],
    ['#f97316', '#ea580c'],
  ];

  const getTeacherColor = (tId) => {
    const idx = (parseInt(tId, 10) || 0) % teacherColors.length;
    return teacherColors[idx];
  };

  const emojiOptions = ['😀', '😂', '😍', '😎', '🎵', '🎹', '🎸', '🎤', '🔥', '👏', '🙏', '💯'];
  const pinnedMessages = messages.filter((m) => m.is_pinned);

  return (
    <View style={[styles.screen, isMobile ? styles.screenMobile : null]}>
      <View style={[styles.container, isMobile ? styles.containerMobile : null]}>
        <View style={[styles.header, isMobile ? styles.headerMobile : null]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBox}>
              <Text style={styles.headerIcon}>💬</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Teacher Lounge</Text>
              <Text
                style={[styles.headerSubtitle, isMobile ? styles.headerSubtitleMobile : null]}
                numberOfLines={1}
              >
                {messages.length} messages · All teachers welcome · {truncateName(teacherName, isMobile ? 12 : 16)}
              </Text>
            </View>
          </View>
          <View style={[styles.onlineBadge, isMobile ? styles.onlineBadgeMobile : null]}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {pinnedMessages.length > 0 && (
          <View style={styles.pinnedWrap}>
            <View style={styles.pinnedTitleRow}>
              <Text style={styles.pinnedIcon}>📌</Text>
              <Text style={styles.pinnedTitle}>Pinned ({pinnedMessages.length})</Text>
            </View>
            {pinnedMessages.map((pm) => (
              <View key={pm.id} style={styles.pinnedItem}>
                <Text style={styles.pinnedName}>{truncateName(pm.teacher_name || 'Teacher', 18)}:</Text>
                <Text style={styles.pinnedText} numberOfLines={1}>{pm.content}</Text>
              </View>
            ))}
          </View>
        )}

        <ScrollView
          ref={chatScrollRef}
          onContentSizeChange={onMessagesSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.chatArea}
          contentContainerStyle={[styles.chatContent, isMobile ? styles.chatContentMobile : null]}
        >
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size='small' color='#6b7280' />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}><Text style={styles.emptyIcon}>💬</Text></View>
              <Text style={styles.emptyTitle}>Welcome to the Teacher Lounge!</Text>
              <Text style={styles.emptyText}>Start a conversation with your fellow teachers.</Text>
            </View>
          ) : (
            messages.map((msg, idx) => {
              const currentTeacherId = teacherId ? String(teacherId) : '';
              const msgTeacherId = String(msg.teacher ?? msg.teacher_id ?? msg.sender_teacher ?? msg.sender_id ?? '');
              const isOwn = !!currentTeacherId && msgTeacherId === currentTeacherId;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const prevTeacherId = prevMsg
                ? String(prevMsg.teacher ?? prevMsg.teacher_id ?? prevMsg.sender_teacher ?? prevMsg.sender_id ?? '')
                : '';
              const sameAsPrev = prevMsg && prevTeacherId === msgTeacherId;
              const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
              const showHeader = !sameAsPrev || showDate;
              const showAvatar = showHeader && !isOwn;
              const showActions = !isMobile || activeActionMessageId === msg.id;
              const [c1] = getTeacherColor(msgTeacherId);
              const displayName = msg.teacher_name || 'Teacher';

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <View style={styles.dateDivider}>
                      <View style={styles.dateLine} />
                      <Text style={styles.dateText}>
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                          weekday: 'long', month: 'short', day: 'numeric',
                        })}
                      </Text>
                      <View style={styles.dateLine} />
                    </View>
                  )}

                  <View style={[
                    styles.msgRow,
                    isOwn ? styles.msgRowOwn : styles.msgRowOther,
                    showHeader ? styles.msgRowWithGap : styles.msgRowCompact,
                    isMobile ? styles.msgRowMobile : null,
                  ]}>
                    <View style={[styles.avatarSlot, !showAvatar ? styles.avatarSlotHidden : null]}>
                      {showAvatar && (
                        msg.teacher_profile_img ? (
                          <Image source={{ uri: msg.teacher_profile_img }} style={[styles.avatarImg, { borderColor: `${c1}55` }]} />
                        ) : (
                          <View style={[styles.avatarFallback, { backgroundColor: c1 }]}>
                            <Text style={styles.avatarFallbackText}>{getInitials(displayName)}</Text>
                          </View>
                        )
                      )}
                    </View>

                    <View style={[
                      styles.msgBlock,
                      isOwn ? styles.msgBlockOwn : styles.msgBlockOther,
                      isMobile ? styles.msgBlockMobile : null,
                      isMobile && isOwn ? styles.msgBlockMobileOwn : null,
                    ]}>
                      {showHeader && (
                        <View style={[styles.msgHeaderRow, isOwn ? styles.msgHeaderRowOwn : styles.msgHeaderRowOther]}>
                          <Text style={[styles.msgName, { color: isOwn ? '#93c5fd' : c1 }]} numberOfLines={1}>
                            {isOwn ? 'You' : truncateName(displayName, 20)}
                          </Text>
                          <Text style={styles.msgTimeTop}>{formatTime(msg.created_at)}</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        activeOpacity={0.86}
                        onLongPress={() => toggleMessageActions(msg.id)}
                        onPress={() => {
                          if (isMobile) {
                            toggleMessageActions(msg.id);
                          }
                        }}
                        style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
                      >
                        {msg.is_pinned && <Text style={styles.pinnedBubbleIcon}>📌</Text>}
                        <Text style={styles.msgText}>{msg.content}</Text>
                        {!showHeader && (
                          <Text style={[styles.msgTimeInline, isOwn ? styles.msgTimeInlineOwn : styles.msgTimeInlineOther]}>
                            {formatTime(msg.created_at)}
                          </Text>
                        )}
                      </TouchableOpacity>

                      {showActions ? (
                        <View style={[
                          styles.msgActionsRow,
                          isOwn ? styles.msgActionsRowOwn : styles.msgActionsRowOther,
                          isMobile ? styles.msgActionsRowMobile : null,
                        ]}>
                          <TouchableOpacity onPress={() => togglePin(msg.id)} style={styles.actionBtn}>
                            <Text style={[styles.actionText, msg.is_pinned ? styles.actionPinOn : styles.actionPinOff]}>
                              {msg.is_pinned ? '📌 Pin' : '📍 Pin'}
                            </Text>
                          </TouchableOpacity>
                          {isOwn && (
                            <TouchableOpacity onPress={() => confirmHide(msg.id)} style={styles.actionBtn}>
                              <Text style={styles.actionDelete}>🗑 Delete</Text>
                            </TouchableOpacity>
                          )}
                          {isMobile && (
                            <TouchableOpacity onPress={() => setActiveActionMessageId(null)} style={styles.actionBtn}>
                              <Text style={styles.actionText}>Close</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        isMobile && (
                          <TouchableOpacity onPress={() => toggleMessageActions(msg.id)} style={styles.quickActionHint}>
                            <Text style={styles.quickActionHintText}>Tap message for actions</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                </React.Fragment>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.inputArea, isMobile ? styles.inputAreaMobile : null]}>
          {showEmojiPicker && (
            <View style={styles.emojiPanel}>
              {emojiOptions.map((emoji) => (
                <TouchableOpacity key={emoji} onPress={() => addEmoji(emoji)} style={styles.emojiBtn}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder='Type a message to the teacher lounge...'
              multiline={true}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowEmojiPicker((prev) => !prev)} style={[styles.emojiToggle, isMobile ? styles.emojiToggleMobile : null]}>
              <Text style={styles.emojiToggleText}>😊</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
              style={[
                styles.sendBtn,
                isMobile ? styles.sendBtnMobile : null,
                (!newMessage.trim() || sending) ? styles.sendBtnDisabled : styles.sendBtnEnabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator size='small' color='#9ca3af' />
              ) : (
                <Text style={[styles.sendText, newMessage.trim() ? styles.sendTextEnabled : styles.sendTextDisabled]}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 16,
    height: '100%',
  },
  screenMobile: {
    padding: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  containerMobile: {
    borderRadius: 14,
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMobile: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    color: '#fff',
    fontSize: 18,
  },
  headerTitle: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  headerSubtitleMobile: {
    fontSize: 11,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
    marginLeft: 8,
    flexShrink: 0,
  },
  onlineBadgeMobile: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  pinnedWrap: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fffbea',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  pinnedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pinnedIcon: {
    color: '#facc15',
    fontSize: 12,
  },
  pinnedTitle: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinnedItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 2,
  },
  pinnedName: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 140,
  },
  pinnedText: {
    color: '#4b5563',
    fontSize: 12,
    flex: 1,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  chatContent: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexGrow: 1,
  },
  chatContentMobile: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(66,133,244,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 24,
    color: '#4285f4',
  },
  emptyTitle: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dateText: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 12,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 3,
    width: '100%',
  },
  msgRowMobile: {
    gap: 8,
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgRowOwn: {
    justifyContent: 'flex-end',
  },
  msgRowWithGap: {
    marginTop: 10,
  },
  msgRowCompact: {
    marginTop: 2,
  },
  avatarSlot: {
    width: 38,
  },
  avatarSlotHidden: {
    width: 0,
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  msgBlock: {
    maxWidth: '75%',
    flexDirection: 'column',
  },
  msgBlockMobile: {
    maxWidth: '83%',
  },
  msgBlockMobileOwn: {
    maxWidth: '88%',
  },
  msgBlockOther: {
    alignItems: 'flex-start',
  },
  msgBlockOwn: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
  },
  msgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  msgHeaderRowOther: {
    justifyContent: 'flex-start',
  },
  msgHeaderRowOwn: {
    justifyContent: 'flex-end',
  },
  msgName: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 170,
  },
  msgTimeTop: {
    fontSize: 10,
    color: '#9ca3af',
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: 'relative',
  },
  bubbleOwn: {
    backgroundColor: '#e8f0ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderBottomLeftRadius: 4,
  },
  pinnedBubbleIcon: {
    position: 'absolute',
    top: 5,
    right: 8,
    fontSize: 10,
  },
  msgText: {
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 21,
  },
  msgTimeInline: {
    fontSize: 10,
    marginTop: 4,
  },
  msgTimeInlineOwn: {
    color: '#9ca3af',
    textAlign: 'right',
  },
  msgTimeInlineOther: {
    color: '#9ca3af',
    textAlign: 'left',
  },
  msgActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  msgActionsRowMobile: {
    marginTop: 4,
  },
  msgActionsRowOwn: {
    justifyContent: 'flex-end',
  },
  msgActionsRowOther: {
    justifyContent: 'flex-start',
  },
  quickActionHint: {
    marginTop: 4,
  },
  quickActionHintText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionPinOn: {
    color: '#facc15',
  },
  actionPinOff: {
    color: '#6b7280',
  },
  actionDelete: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '500',
  },
  inputArea: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  inputAreaMobile: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  emojiPanel: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  emojiBtn: {
    padding: 4,
    borderRadius: 6,
  },
  emojiText: {
    fontSize: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: '#1f2937',
    fontSize: 14,
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  emojiToggle: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiToggleMobile: {
    width: 42,
    height: 42,
    borderRadius: 11,
  },
  emojiToggleText: {
    fontSize: 20,
  },
  sendBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 74,
  },
  sendBtnMobile: {
    minWidth: 66,
    paddingHorizontal: 14,
    height: 42,
  },
  sendBtnEnabled: {
    backgroundColor: '#4285f4',
    borderWidth: 1,
    borderColor: 'rgba(66,133,244,0.3)',
  },
  sendBtnDisabled: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendTextEnabled: {
    color: '#fff',
  },
  sendTextDisabled: {
    color: '#9ca3af',
  },
});

export default TeacherCommunity;
