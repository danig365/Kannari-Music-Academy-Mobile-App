import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const POLL_INTERVAL = 5000;

const GroupChat = ({ groupId, studentId }) => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minorBlocked, setMinorBlocked] = useState(false);

  const scrollViewRef = useRef(null);
  const pollRef = useRef(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/minor-access-status/`);
        if (res.data.is_minor && !res.data.can_send_messages) {
          setMinorBlocked(true);
        }
      } catch {
        // silent fail
      }
    };

    if (studentId) checkAccess();
  }, [studentId]);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 80);
  };

  const fetchMessages = useCallback(
    async (scroll = false) => {
      try {
        const res = await axios.get(`${baseUrl}/group/${groupId}/messages/`);
        const msgs = Array.isArray(res.data) ? res.data : [];
        setMessages(msgs);
        if (scroll || isAtBottomRef.current) {
          scrollToBottom(true);
        }
      } catch (err) {
        console.log('Failed to fetch messages:', err);
      }
      setLoading(false);
    },
    [groupId]
  );

  useEffect(() => {
    fetchMessages(true);
    pollRef.current = setInterval(() => fetchMessages(false), POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [groupId, fetchMessages]);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isAtBottomRef.current = distanceFromBottom < 60;
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;

    setSending(true);
    try {
      await axios.post(`${baseUrl}/group/${groupId}/messages/`, {
        sender_type: 'student',
        sender_id: studentId,
        sender_student: studentId,
        content: newMsg.trim(),
      });

      setNewMsg('');
      isAtBottomRef.current = true;
      await fetchMessages(true);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.[0] ||
        'Students under 18 cannot send group messages directly.';
      Alert.alert('Message not sent', typeof errMsg === 'string' ? errMsg : 'Failed to send message.');
    }

    setSending(false);
  };

  const timeAgo = (dateValue) => {
    const diff = Math.floor((Date.now() - new Date(dateValue)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateValue).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSenderColor = (msg) => {
    if (msg.sender_type === 'teacher') return '#6366f1';
    if (msg.sender_type === 'admin' || msg.sender_type === 'school') return '#ef4444';
    if (msg.sender_type === 'parent') return '#f59e0b';
    return '#3b82f6';
  };

  const getSenderInitials = (msg) => {
    const name = msg.sender_name_display || msg.sender_name || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const isOwnMessage = (msg) => {
    return msg.sender_type === 'student' && String(msg.sender_student) === String(studentId);
  };

  const pinnedMessages = messages.filter((msg) => msg.is_pinned);

  return (
    <View style={styles.chatWrap}>
      {pinnedMessages.length > 0 && (
        <View style={styles.pinnedBanner}>
          <Bootstrap name="pin-fill" size={12} color="#f59e0b" />
          <Text style={styles.pinnedText}>
            <Text style={styles.pinnedStrong}>Pinned:</Text>{' '}
            {pinnedMessages[pinnedMessages.length - 1]?.content?.substring(0, 100)}
            {pinnedMessages.length > 1 ? ` (+${pinnedMessages.length - 1} more)` : ''}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
      >
        {loading ? (
          <View style={styles.centerInfoWrap}>
            <Text style={styles.centerInfoText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerInfoWrap}>
            <Bootstrap name="chat-dots" size={32} color="#94a3b8" />
            <Text style={styles.centerInfoText}>No messages yet. Start the conversation!</Text>
          </View>
        ) : (
          messages.map((msg, idx) => {
            const own = isOwnMessage(msg);
            const color = getSenderColor(msg);
            const previous = messages[idx - 1];
            const showAvatar =
              idx === 0 ||
              previous?.sender_name !== msg.sender_name ||
              new Date(msg.created_at) - new Date(previous?.created_at) > 300000;

            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  own ? styles.msgRowOwn : styles.msgRowOther,
                  { marginTop: showAvatar ? 12 : 2 },
                ]}
              >
                {showAvatar ? (
                  <View style={[styles.avatar, { backgroundColor: color }]}>
                    {msg.sender_profile_img ? (
                      <Image source={{ uri: msg.sender_profile_img }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarInitials}>{getSenderInitials(msg)}</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.avatarSpacer} />
                )}

                <View style={[styles.msgBodyWrap, own ? styles.msgBodyWrapOwn : styles.msgBodyWrapOther]}>
                  {showAvatar && (
                    <View style={[styles.msgMetaRow, own ? styles.msgMetaRowOwn : styles.msgMetaRowOther]}>
                      <Text style={[styles.msgSenderName, { color }]}>
                        {msg.sender_name_display || msg.sender_name}
                      </Text>
                      <Text style={styles.msgTypeBadge}>{msg.sender_type}</Text>
                      <Text style={styles.msgTime}>{timeAgo(msg.created_at)}</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.msgBubble,
                      own ? styles.msgBubbleOwn : styles.msgBubbleOther,
                      msg.is_pinned && !own ? styles.msgBubblePinned : null,
                    ]}
                  >
                    {msg.is_pinned && !own && (
                      <Bootstrap name="pin-fill" size={11} color="#f59e0b" style={styles.pinIcon} />
                    )}
                    <Text style={[styles.msgText, own ? styles.msgTextOwn : styles.msgTextOther]}>
                      {msg.content}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {minorBlocked ? (
        <View style={styles.minorBlockedWrap}>
          <Bootstrap name="shield-lock-fill" size={16} color="#f59e0b" />
          <Text style={styles.minorBlockedText}>
            Group chat sending is locked — parent approval required.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('/parent/login')}>
            <Text style={styles.parentPortalLink}>Parent Portal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput
            value={newMsg}
            onChangeText={setNewMsg}
            placeholder="Type a message..."
            multiline
            style={styles.input}
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMsg.trim() || sending}
            style={[
              styles.sendBtn,
              newMsg.trim() ? styles.sendBtnActive : styles.sendBtnDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Bootstrap name="send-fill" size={14} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chatWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 550,
    overflow: 'hidden',
  },
  pinnedBanner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fefce8',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinnedText: {
    flex: 1,
    color: '#92400e',
    fontSize: 12,
  },
  pinnedStrong: {
    fontWeight: '700',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
  },
  centerInfoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  centerInfoText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  msgRow: {
    flexDirection: 'row',
    gap: 8,
  },
  msgRowOwn: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSpacer: {
    width: 32,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  msgBodyWrap: {
    maxWidth: '78%',
  },
  msgBodyWrapOwn: {
    alignItems: 'flex-end',
  },
  msgBodyWrapOther: {
    alignItems: 'flex-start',
  },
  msgMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  msgMetaRowOwn: {
    justifyContent: 'flex-end',
  },
  msgMetaRowOther: {
    justifyContent: 'flex-start',
  },
  msgSenderName: {
    fontSize: 12,
    fontWeight: '700',
  },
  msgTypeBadge: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'capitalize',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  msgTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  msgBubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  msgBubbleOwn: {
    backgroundColor: '#6366f1',
  },
  msgBubbleOther: {
    backgroundColor: '#f1f5f9',
  },
  msgBubblePinned: {
    backgroundColor: '#fef3c7',
  },
  pinIcon: {
    marginTop: 2,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  msgTextOwn: {
    color: '#ffffff',
  },
  msgTextOther: {
    color: '#1e293b',
  },
  minorBlockedWrap: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  minorBlockedText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  parentPortalLink: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1e293b',
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
    backgroundColor: '#6366f1',
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
});

export default GroupChat;
