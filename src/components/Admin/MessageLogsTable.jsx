import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../shared/LoadingSpinner';

const MessageLogsTable = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sender_type: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [page, setPage] = useState(1);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const perPage = 25;

  useEffect(() => {
    fetchMessages(page, filters);
  }, [page]);

  const fetchMessages = async (targetPage = page, activeFilters = filters) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/messages/?limit=${perPage}&offset=${(targetPage - 1) * perPage}`;
      if (activeFilters.sender_type) url += `&sender_type=${activeFilters.sender_type}`;
      const res = await axios.get(url);
      const data = res.data;
      setMessages(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (page !== 1) {
      setPage(1);
      return;
    }
    fetchMessages(1, filters);
  };

  const handleClear = () => {
    const cleared = { sender_type: '', search: '', date_from: '', date_to: '' };
    setFilters(cleared);
    setSelectedMsg(null);
    if (page !== 1) {
      setPage(1);
      return;
    }
    fetchMessages(1, cleared);
  };

  const filteredMessages = useMemo(
    () =>
      messages.filter((m) => {
        if (filters.search) {
          const s = filters.search.toLowerCase();
          if (!(m.content || '').toLowerCase().includes(s) && !(m.sender_display || '').toLowerCase().includes(s)) {
            return false;
          }
        }

        if (filters.date_from) {
          if (new Date(m.created_at) < new Date(filters.date_from)) return false;
        }

        if (filters.date_to) {
          if (new Date(m.created_at) > new Date(`${filters.date_to}T23:59:59`)) return false;
        }

        return true;
      }),
    [messages, filters.search, filters.date_from, filters.date_to]
  );

  const handleExport = async () => {
    try {
      const headers = ['ID', 'Date', 'Sender Type', 'Sender ID', 'Recipient Type', 'Content', 'Parent Link', 'Read'];
      const rows = filteredMessages.map((m) => [
        m.id,
        new Date(m.created_at).toLocaleString(),
        m.sender_type,
        m.sender_teacher || m.sender_parent || m.sender_student || '-',
        m.recipient_type,
        `"${(m.content || '').replace(/"/g, '""')}"`,
        m.parent_link || '-',
        m.is_read ? 'Yes' : 'No',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      await Share.share({ message: csv, title: `message_logs_${new Date().toISOString().slice(0, 10)}.csv` });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to share CSV data on this device.');
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '-';
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const senderTypeStyle = (type) => {
    if (type === 'teacher') return styles.badgeTeacher;
    if (type === 'parent') return styles.badgeParent;
    if (type === 'student') return styles.badgeStudent;
    if (type === 'admin') return styles.badgeAdmin;
    return styles.badgeDefault;
  };

  const readCount = filteredMessages.filter((m) => m.is_read).length;
  const unreadCount = filteredMessages.length - readCount;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filters</Text>

          <TextInput
            style={styles.input}
            placeholder="Sender Type (teacher/parent/student/admin)"
            value={filters.sender_type}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, sender_type: value }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Search messages..."
            value={filters.search}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          />

          <TextInput
            style={styles.input}
            placeholder="From Date (YYYY-MM-DD)"
            value={filters.date_from}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, date_from: value }))}
          />

          <TextInput
            style={styles.input}
            placeholder="To Date (YYYY-MM-DD)"
            value={filters.date_to}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, date_to: value }))}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleFilter}>
              <Text style={styles.primaryBtnText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleClear}>
              <Text style={styles.secondaryBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successBtn} onPress={handleExport}>
              <Text style={styles.successBtnText}>CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>{filteredMessages.length} messages shown</Text>
          <Text style={styles.statText}>{readCount} read</Text>
          <Text style={styles.statText}>{unreadCount} unread</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner size="md" text="Loading messages..." />
          </View>
        ) : filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages found</Text>
          </View>
        ) : (
          <View>
            {filteredMessages.map((msg) => {
              const expanded = selectedMsg?.id === msg.id;

              return (
                <View key={msg.id} style={styles.msgCard}>
                  <TouchableOpacity
                    style={styles.msgHeader}
                    onPress={() => setSelectedMsg(expanded ? null : msg)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.msgId}>#{msg.id}</Text>
                    <Text style={styles.msgDate}>{timeAgo(msg.created_at)}</Text>
                    <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  <View style={styles.rowWrap}>
                    <View style={[styles.typeBadge, senderTypeStyle(msg.sender_type)]}>
                      <Text style={styles.typeBadgeText}>{msg.sender_type || 'unknown'}</Text>
                    </View>
                    <Text style={styles.senderText}>{msg.sender_display || '-'}</Text>
                    <Text style={styles.toText}>→</Text>
                    <View style={[styles.typeBadge, senderTypeStyle(msg.recipient_type)]}>
                      <Text style={styles.typeBadgeText}>{msg.recipient_type || 'unknown'}</Text>
                    </View>
                  </View>

                  <Text numberOfLines={1} style={styles.messagePreview}>
                    {msg.content || '-'}
                  </Text>

                  <Text style={[styles.readStatus, msg.is_read ? styles.readYes : styles.readNo]}>
                    {msg.is_read ? 'Read' : 'Unread'}
                  </Text>

                  {expanded && (
                    <View style={styles.detailCard}>
                      <DetailRow label="From" value={msg.sender_display || '-'} />
                      <DetailRow label="Sender Type" value={msg.sender_type || '-'} />
                      <DetailRow label="Recipient Type" value={msg.recipient_type || '-'} />
                      <DetailRow label="Parent Link ID" value={msg.parent_link || '-'} />
                      <DetailRow label="Date" value={msg.created_at ? new Date(msg.created_at).toLocaleString() : '-'} />
                      <DetailRow label="Read" value={msg.is_read ? 'Yes' : 'No'} />
                      <DetailRow label="Message ID" value={`${msg.id}`} />

                      <Text style={styles.detailContentLabel}>Message</Text>
                      <Text style={styles.detailContent}>{msg.content || '-'}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
            disabled={page <= 1}
            onPress={() => setPage((prev) => prev - 1)}
          >
            <Text style={styles.pageBtnText}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageText}>Page {page}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, messages.length < perPage && styles.pageBtnDisabled]}
            disabled={messages.length < perPage}
            onPress={() => setPage((prev) => prev + 1)}
          >
            <Text style={styles.pageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 12, paddingBottom: 24 },
  filterCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
  },
  filterTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryBtnText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  successBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  successBtnText: { color: '#166534', fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statText: { fontSize: 12, color: '#64748b' },
  loadingWrap: { paddingVertical: 20 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  msgCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  msgId: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  msgDate: { color: '#334155', fontSize: 12, flex: 1, marginLeft: 8 },
  chevron: { color: '#94a3b8', fontSize: 12 },
  rowWrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  typeBadge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  badgeTeacher: { backgroundColor: '#eef2ff' },
  badgeParent: { backgroundColor: '#f3e8ff' },
  badgeStudent: { backgroundColor: '#eff6ff' },
  badgeAdmin: { backgroundColor: '#fee2e2' },
  badgeDefault: { backgroundColor: '#e2e8f0' },
  senderText: { fontSize: 12, color: '#334155' },
  toText: { fontSize: 12, color: '#94a3b8' },
  messagePreview: { marginTop: 8, fontSize: 12, color: '#0f172a' },
  readStatus: { marginTop: 6, fontSize: 12, fontWeight: '700' },
  readYes: { color: '#10b981' },
  readNo: { color: '#f59e0b' },
  detailCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  detailRow: { marginBottom: 6 },
  detailLabel: { fontSize: 11, color: '#64748b' },
  detailValue: { fontSize: 12, color: '#0f172a' },
  detailContentLabel: { marginTop: 6, fontSize: 11, color: '#64748b' },
  detailContent: {
    marginTop: 4,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
  },
  paginationRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  pageText: { fontSize: 13, color: '#64748b' },
});

export default MessageLogsTable;
