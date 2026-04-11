import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const PRIORITY_META = {
  urgent: { label: 'Urgent', color: '#ef4444', icon: 'exclamation-triangle-fill' },
  high: { label: 'High', color: '#f59e0b', icon: 'exclamation-circle-fill' },
  normal: { label: 'Normal', color: '#3b82f6', icon: 'info-circle-fill' },
  low: { label: 'Low', color: '#6b7280', icon: 'dash-circle' },
};

const formatTimeAgo = (dateValue) => {
  const diff = Math.floor((Date.now() - new Date(dateValue)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const GroupAnnouncements = ({ groupId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [groupId]);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/announcements/`);
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const openAttachment = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open attachment.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading announcements...</Text>
      </View>
    );
  }

  const pinnedAnnouncements = announcements.filter((a) => a.is_pinned);
  const regularAnnouncements = announcements.filter((a) => !a.is_pinned);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <Bootstrap name="megaphone" size={36} color="#cbd5e1" />
          <Text style={styles.emptyText}>No announcements yet.</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {pinnedAnnouncements.length > 0 && (
            <View style={styles.groupWrap}>
              <View style={styles.groupHeader}>
                <Bootstrap name="pin-fill" size={12} color="#f59e0b" />
                <Text style={styles.groupHeaderPinned}>Pinned</Text>
              </View>
              {pinnedAnnouncements.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onOpenAttachment={openAttachment}
                />
              ))}
            </View>
          )}

          {regularAnnouncements.length > 0 && (
            <View style={styles.groupWrap}>
              {pinnedAnnouncements.length > 0 && (
                <Text style={styles.groupHeaderRecent}>Recent</Text>
              )}
              {regularAnnouncements.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onOpenAttachment={openAttachment}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const AnnouncementCard = ({ announcement, expandedId, setExpandedId, onOpenAttachment }) => {
  const meta = PRIORITY_META[announcement.priority] || PRIORITY_META.normal;
  const isExpanded = expandedId === announcement.id;
  const isLong = announcement.content && announcement.content.length > 200;

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{announcement.title}</Text>

          {announcement.priority !== 'normal' && (
            <View style={[styles.priorityBadge, { backgroundColor: `${meta.color}20` }]}>
              <Bootstrap name={meta.icon} size={10} color={meta.color} />
              <Text style={[styles.priorityText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          )}

          {announcement.is_pinned && <Bootstrap name="pin-fill" size={14} color="#f59e0b" />}
        </View>

        <Text style={styles.cardContent}>
          {isLong && !isExpanded
            ? `${announcement.content.substring(0, 200)}...`
            : announcement.content}
        </Text>

        {isLong && (
          <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : announcement.id)}>
            <Text style={styles.readMoreText}>{isExpanded ? 'Show less' : 'Read more'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {announcement.file && (
        <TouchableOpacity
          style={styles.attachmentBtn}
          onPress={() => onOpenAttachment(announcement.file)}
        >
          <Bootstrap name="paperclip" size={12} color="#2563eb" />
          <Text style={styles.attachmentBtnText}>Attached File</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Bootstrap name="person" size={11} color="#94a3b8" />
          <Text style={styles.footerText}>{announcement.author_name}</Text>
        </View>
        <View style={styles.footerItem}>
          <Bootstrap name="clock" size={11} color="#94a3b8" />
          <Text style={styles.footerText}>{formatTimeAgo(announcement.created_at)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 18,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  emptyText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  listWrap: {
    gap: 8,
  },
  groupWrap: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupHeaderPinned: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupHeaderRecent: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardContent: {
    marginTop: 2,
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
  },
  readMoreText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  attachmentBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachmentBtnText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});

export default GroupAnnouncements;
