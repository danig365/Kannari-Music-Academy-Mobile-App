import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../config';
import { getConversation, getChatLockStatus, markMessagesRead, sendMessage } from '../../services/messagingService';
import { useAuth } from '../../context/AuthContext';

const ParentMessages = () => {
  const navigation = useNavigation();
  const { setRole } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const baseUrl = API_BASE_URL;

  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('Parent');
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({ allowed: true, reason: '' });
  const [chatLock, setChatLock] = useState(null);
  const [parentLinkId, setParentLinkId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const pollRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    initAuthAndData();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const initAuthAndData = async () => {
    const [id, name, loginStatus] = await Promise.all([
      AsyncStorage.getItem('parentId'),
      AsyncStorage.getItem('parentName'),
      AsyncStorage.getItem('parentLoginStatus'),
    ]);

    if (!id || loginStatus !== 'true') {
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'ParentLogin' }] });
      }
      return;
    }

    setParentId(id);
    setParentName(name || 'Parent');
    fetchChildren(id);
  };

  const fetchChildren = async (id = parentId) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/parent/${id}/children/`);
      if (res.ok) {
        const data = await res.json();
        setChildren(Array.isArray(data) ? data : data.children || []);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch children');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const loadMessages = async (linkId, id = parentId) => {
    try {
      const res = await getConversation(linkId);
      setMessages(res.data.messages || []);
      setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
      await markMessagesRead(linkId, 'parent', id);
      scrollToBottom();
    } catch (err) {
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const loadChatLock = async (linkId) => {
    try {
      const res = await getChatLockStatus(linkId);
      setChatLock(res.data);
    } catch (err) {
      setChatLock(null);
    }
  };

  const openChildChat = async (child) => {
    setActiveChild(child);
    setMessages([]);
    setChatStatus({ allowed: true, reason: '' });
    setChatLock(null);
    setParentLinkId(null);

    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    try {
      const linkId = child.parent_link_id || child.link_id;
      if (!linkId) {
        setChatStatus({ allowed: false, reason: 'No link found for this child' });
        return;
      }

      setParentLinkId(linkId);
      await loadMessages(linkId);
      await loadChatLock(linkId);

      pollRef.current = setInterval(async () => {
        try {
          const res = await getConversation(linkId);
          const newMsgs = res.data.messages || [];

          setMessages((prev) => {
            const hasChanged =
              newMsgs.length !== prev.length
              || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id);

            if (hasChanged) {
              markMessagesRead(linkId, 'parent', parentId).catch(() => {});
              scrollToBottom();
              return newMsgs;
            }

            return prev;
          });

          setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
        } catch (e) {
          // silent
        }
      }, 5000);
    } catch (err) {
      Alert.alert('Error', 'Failed to open chat');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !parentLinkId) return;
    setSending(true);
    try {
      await sendMessage({
        sender_type: 'parent',
        sender_id: parentId,
        recipient_type: 'teacher',
        content: newMessage.trim(),
        parent_link_id: parentLinkId,
      });
      setNewMessage('');
      await loadMessages(parentLinkId);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['parentId', 'parentName', 'parentLoginStatus']);
    setRole(null);
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLockCountdown = () => {
    if (!chatLock || chatLock.chat_allowed) return null;

    if (chatLock.next_unlock) {
      const next = new Date(chatLock.next_unlock);
      const now = new Date();
      const diff = Math.max(0, Math.floor((next - now) / 60000));

      if (diff > 60) return `${Math.floor(diff / 60)}h ${diff % 60}m until unlock`;
      if (diff > 0) return `${diff}m until unlock`;
      return 'Unlocking soon...';
    }

    return 'Chat locked by school';
  };

  const renderChildren = () => {
    if (loading) {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      );
    }

    if (children.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No linked children found</Text>
          <Text style={styles.emptySub}>Your child&apos;s account needs to be linked first</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.childList} contentContainerStyle={styles.childListContent}>
        {children.map((child, idx) => {
          const childId = child.student_id || child.id;
          const activeId = activeChild?.student_id || activeChild?.id;
          const isActive = childId === activeId;

          return (
            <TouchableOpacity
              key={childId || idx}
              style={[styles.childItem, isActive && styles.childItemActive]}
              onPress={() => openChildChat(child)}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(child.student_name || child.fullname || 'S').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.childName}>{child.student_name || child.fullname || 'Student'}</Text>
                <Text style={styles.childMeta}>
                  {child.relationship ? `${child.relationship} • ` : ''}
                  Teacher conversation
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderChatPanel = () => {
    if (!activeChild) {
      return (
        <View style={styles.chatEmptyWrap}>
          <Text style={styles.chatEmptyIcon}>💬</Text>
          <Text style={styles.chatEmptyTitle}>Select a child to view their teacher conversation</Text>
          <Text style={styles.chatEmptySub}>Messages are monitored for child safety</Text>
        </View>
      );
    }

    return (
      <View style={styles.chatPanel}>
        <View style={styles.chatHeader}>
          {isMobile ? (
            <TouchableOpacity
              onPress={() => {
                setActiveChild(null);
                if (pollRef.current) {
                  clearInterval(pollRef.current);
                }
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {(activeChild.student_name || activeChild.fullname || 'S').substring(0, 2).toUpperCase()}
            </Text>
          </View>

          <View style={styles.flex1}>
            <Text style={styles.headerName}>{activeChild.student_name || activeChild.fullname || 'Student'}</Text>
            <Text style={[styles.headerStatus, { color: chatStatus.allowed ? '#10b981' : '#ef4444' }]}>
              {chatStatus.allowed ? 'Chat available' : chatStatus.reason}
            </Text>
          </View>

          {chatLock ? (
            <View style={[styles.lockPill, !chatLock.chat_allowed ? styles.lockPillLocked : styles.lockPillOpen]}>
              <Text style={[styles.lockPillText, !chatLock.chat_allowed ? styles.lockTextLocked : styles.lockTextOpen]}>
                {!chatLock.chat_allowed ? 'Locked' : 'Open'}
              </Text>
            </View>
          ) : null}
        </View>

        <ScrollView ref={scrollRef} style={styles.messageArea} contentContainerStyle={styles.messageContent}>
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>All messages are monitored for child safety compliance</Text>
          </View>

          {messages.length === 0 ? (
            <View style={styles.centerBlock}>
              <Text style={styles.centerText}>
                {parentLinkId ? 'No messages yet. Start a conversation with your child\'s teacher.' : 'Link not established'}
              </Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_type === 'parent' && String(msg.sender_parent) === String(parentId);
              return (
                <View key={msg.id} style={[styles.messageRow, isMine ? styles.rowEnd : styles.rowStart]}>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                    {!isMine ? <Text style={styles.senderName}>{msg.sender_display || 'Teacher'}</Text> : null}
                    <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{msg.content}</Text>
                    <Text style={[styles.messageTime, isMine ? styles.timeMine : styles.timeOther]}>
                      {timeAgo(msg.created_at)}
                      {isMine && msg.is_read ? '  ✓✓' : ''}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {chatStatus.allowed && parentLinkId ? (
          <View style={styles.inputBar}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message to the teacher..."
              placeholderTextColor="#94a3b8"
              multiline
              style={styles.input}
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              <Text style={styles.sendBtnText}>{sending ? '...' : '➤'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lockedBar}>
            <Text style={styles.lockedText}>{chatStatus.reason || 'Messaging unavailable'}</Text>
            {chatLock && !chatLock.chat_allowed && formatLockCountdown() ? (
              <Text style={styles.lockedSub}>{formatLockCountdown()}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const showListPane = !isMobile || !activeChild;
  const showChatPane = !isMobile || !!activeChild;

  return (
    <View style={styles.container}>
      {showListPane ? (
        <View style={[styles.leftPane, !isMobile && styles.leftPaneDesktop]}>
          <View style={styles.leftHeader}>
            <View style={styles.leftHeaderIconWrap}>
              <Text style={styles.leftHeaderIcon}>👪</Text>
            </View>
            <View>
              <Text style={styles.leftHeaderTitle}>Messages</Text>
              <Text style={styles.leftHeaderSub}>Hi, {parentName}</Text>
            </View>
          </View>

          {chatLock && !chatLock.chat_allowed ? (
            <View style={styles.lockBanner}>
              <Text style={styles.lockBannerTitle}>Chat Locked</Text>
              <Text style={styles.lockBannerText}>{formatLockCountdown()}</Text>
            </View>
          ) : null}

          <View style={styles.flex1}>{renderChildren()}</View>

          <View style={styles.logoutWrap}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {showChatPane ? <View style={styles.rightPane}>{renderChatPanel()}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    flexDirection: 'row',
  },
  leftPane: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  leftPaneDesktop: {
    maxWidth: 320,
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  leftHeader: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftHeaderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  leftHeaderIcon: {
    fontSize: 18,
  },
  leftHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  leftHeaderSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 1,
  },
  lockBanner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  lockBannerTitle: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
  },
  lockBannerText: {
    color: '#a16207',
    fontSize: 11,
    marginTop: 2,
  },
  childList: {
    flex: 1,
  },
  childListContent: {
    paddingBottom: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  childItemActive: {
    backgroundColor: '#f5f3ff',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  flex1: {
    flex: 1,
  },
  childName: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  childMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  centerText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 42,
  },
  emptyIcon: {
    fontSize: 42,
  },
  emptyTitle: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySub: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  logoutWrap: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  logoutText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  chatPanel: {
    flex: 1,
  },
  chatEmptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  chatEmptyIcon: {
    fontSize: 64,
  },
  chatEmptyTitle: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatEmptySub: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  chatHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backBtnText: {
    color: '#64748b',
    fontSize: 20,
    marginTop: -2,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerName: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  headerStatus: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  lockPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  lockPillLocked: {
    backgroundColor: '#fef3c7',
  },
  lockPillOpen: {
    backgroundColor: '#d1fae5',
  },
  lockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lockTextLocked: {
    color: '#92400e',
  },
  lockTextOpen: {
    color: '#065f46',
  },
  messageArea: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    paddingBottom: 12,
  },
  noticeBox: {
    alignSelf: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  noticeText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rowStart: {
    justifyContent: 'flex-start',
  },
  rowEnd: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleMine: {
    backgroundColor: '#7c3aed',
    borderTopRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 4,
  },
  senderName: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    color: '#1e293b',
    fontSize: 14,
  },
  messageTextMine: {
    color: '#ffffff',
  },
  messageTime: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'right',
  },
  timeMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  timeOther: {
    color: '#94a3b8',
  },
  inputBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: '#1e293b',
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  lockedBar: {
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  lockedText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockedSub: {
    marginTop: 4,
    color: '#b91c1c',
    fontSize: 11,
  },
});

export default ParentMessages;
