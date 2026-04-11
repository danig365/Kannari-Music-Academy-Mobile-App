import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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

const ActivityLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    model_name: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const perPage = 30;

  useEffect(() => {
    fetchLogs(page, filters);
  }, [page]);

  const fetchLogs = async (targetPage = page, activeFilters = filters) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/audit/activity-logs/?limit=${perPage}&offset=${(targetPage - 1) * perPage}`;
      if (activeFilters.action) url += `&action=${activeFilters.action}`;
      if (activeFilters.model_name) url += `&model_name=${encodeURIComponent(activeFilters.model_name)}`;
      if (activeFilters.search) url += `&search=${encodeURIComponent(activeFilters.search)}`;
      if (activeFilters.date_from) url += `&date_from=${activeFilters.date_from}`;
      if (activeFilters.date_to) url += `&date_to=${activeFilters.date_to}`;
      const res = await axios.get(url);
      setLogs(res.data.results || []);
      setTotal(res.data.count || 0);
    } catch (err) {
      Alert.alert('Error', 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setSelectedLog(null);
    if (page !== 1) {
      setPage(1);
      return;
    }
    fetchLogs(1, filters);
  };

  const handleReset = () => {
    const cleared = { action: '', model_name: '', search: '', date_from: '', date_to: '' };
    setFilters(cleared);
    setSelectedLog(null);
    if (page !== 1) {
      setPage(1);
      return;
    }
    fetchLogs(1, cleared);
  };

  const handleExport = async () => {
    try {
      const headers = ['ID', 'Date', 'Action', 'Actor', 'Actor Type', 'Model', 'Object ID', 'Description', 'IP'];
      const rows = logs.map((l) => [
        l.id,
        new Date(l.created_at).toLocaleString(),
        l.action,
        `"${(l.actor || '').replace(/"/g, '""')}"`,
        l.actor_type,
        l.model_name,
        l.object_id || '-',
        `"${(l.description || '').replace(/"/g, '""')}"`,
        l.ip_address || '-',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      await Share.share({ message: csv, title: `activity_logs_${new Date().toISOString().slice(0, 10)}.csv` });
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

  const actionColor = (action) => {
    const colors = {
      login: '#10b981',
      logout: '#6b7280',
      create: '#3b82f6',
      update: '#f59e0b',
      delete: '#ef4444',
      view: '#8b5cf6',
      export: '#06b6d4',
      message: '#7c3aed',
      submission: '#ec4899',
      session_join: '#10b981',
      session_leave: '#f97316',
      session_start: '#059669',
      session_end: '#dc2626',
    };
    return colors[action] || '#64748b';
  };

  const actorTypeStyle = (type) => {
    if (type === 'admin') return styles.actorAdmin;
    if (type === 'teacher') return styles.actorTeacher;
    if (type === 'student') return styles.actorStudent;
    if (type === 'parent') return styles.actorParent;
    return styles.actorDefault;
  };

  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const messageCount = logs.filter((l) => l.action === 'message').length;
  const submissionCount = logs.filter((l) => l.action === 'submission').length;
  const sessionCount = logs.filter((l) => (l.action || '').startsWith('session')).length;

  const pageItems = useMemo(() => {
    const visible = Math.min(totalPages, 7);
    return Array.from({ length: visible }, (_, i) => {
      if (totalPages <= 7) return i + 1;
      if (page <= 4) return i + 1;
      if (page >= totalPages - 3) return totalPages - 6 + i;
      return page - 3 + i;
    });
  }, [page, totalPages]);

  const rangeStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, total);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filters</Text>

          <TextInput
            style={styles.input}
            placeholder="Action (e.g. login, message, session_start)"
            value={filters.action}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, action: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Model (e.g. Message)"
            value={filters.model_name}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, model_name: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Search description..."
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
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
              <Text style={styles.secondaryBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successBtn} onPress={handleExport}>
              <Text style={styles.successBtnText}>CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsWrap}>
          <StatPill value={total} label="total logs" color="#16a34a" bg="#f0fdf4" />
          <StatPill value={messageCount} label="messages (this page)" color="#7c3aed" bg="#faf5ff" />
          <StatPill value={submissionCount} label="submissions (this page)" color="#ec4899" bg="#fdf2f8" />
          <StatPill value={sessionCount} label="session events (this page)" color="#059669" bg="#ecfdf5" />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner size="md" text="Loading activity logs..." />
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activity logs found</Text>
          </View>
        ) : (
          logs.map((log) => {
            const color = actionColor(log.action);
            return (
              <TouchableOpacity
                key={log.id}
                style={styles.logCard}
                activeOpacity={0.9}
                onPress={() => setSelectedLog(log)}
              >
                <View style={styles.logTopRow}>
                  <Text style={styles.logId}>#{log.id}</Text>
                  <Text style={styles.timeText}>{timeAgo(log.created_at)}</Text>
                </View>

                <View style={styles.rowWrap}>
                  <View style={[styles.actionBadge, { backgroundColor: `${color}22` }]}>
                    <Text style={[styles.actionBadgeText, { color }]}>{(log.action || 'unknown').replace(/_/g, ' ')}</Text>
                  </View>

                  <Text style={styles.actorName}>{log.actor || 'System'}</Text>
                  {log.actor_type ? (
                    <View style={[styles.actorBadge, actorTypeStyle(log.actor_type)]}>
                      <Text style={styles.actorBadgeText}>{log.actor_type}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.modelRow}>
                  {log.model_name ? <Text style={styles.modelTag}>{log.model_name}</Text> : null}
                  {log.object_id ? <Text style={styles.objectId}>#{log.object_id}</Text> : null}
                </View>

                <Text style={styles.descriptionText} numberOfLines={1}>
                  {log.description || 'No description'}
                </Text>
                <Text style={styles.ipText}>{log.ip_address || '-'}</Text>
              </TouchableOpacity>
            );
          })
        )}

        {totalPages > 1 && (
          <View style={styles.paginationWrap}>
            <View style={styles.paginationRow}>
              <PageBtn label="‹" disabled={page === 1} onPress={() => setPage((p) => Math.max(1, p - 1))} />
              {pageItems.map((pageNum) => (
                <TouchableOpacity
                  key={pageNum}
                  style={[styles.pageBtn, pageNum === page && styles.pageBtnActive]}
                  onPress={() => setPage(pageNum)}
                >
                  <Text style={[styles.pageBtnText, pageNum === page && styles.pageBtnTextActive]}>{pageNum}</Text>
                </TouchableOpacity>
              ))}
              <PageBtn label="›" disabled={page === totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))} />
            </View>
            <Text style={styles.rangeText}>
              Showing {rangeStart}–{rangeEnd} of {total}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedLog} transparent animationType="fade" onRequestClose={() => setSelectedLog(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Activity Log {selectedLog ? `#${selectedLog.id}` : ''}</Text>
            {selectedLog && (
              <ScrollView>
                <DetailRow label="Action" value={(selectedLog.action || 'unknown').replace(/_/g, ' ')} />
                <DetailRow label="Actor" value={selectedLog.actor || 'System'} />
                <DetailRow label="Actor Type" value={selectedLog.actor_type || '-'} />
                <DetailRow
                  label="Model / Object"
                  value={`${selectedLog.model_name || '-'} ${selectedLog.object_id ? `#${selectedLog.object_id}` : ''}`}
                />
                <DetailRow
                  label="Timestamp"
                  value={selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : '-'}
                />
                <DetailRow label="IP Address" value={selectedLog.ip_address || '-'} mono />
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionFull}>{selectedLog.description || 'No description'}</Text>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setSelectedLog(null)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const StatPill = ({ value, label, color, bg }) => (
  <View style={[styles.statPill, { backgroundColor: bg }]}> 
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}> {label}</Text>
  </View>
);

const DetailRow = ({ label, value, mono = false }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, mono && styles.mono]}>{value || '-'}</Text>
  </View>
);

const PageBtn = ({ label, disabled, onPress }) => (
  <TouchableOpacity style={[styles.pageBtn, disabled && styles.pageBtnDisabled]} onPress={onPress} disabled={disabled}>
    <Text style={styles.pageBtnText}>{label}</Text>
  </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  successBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: { color: '#166534', fontSize: 12, fontWeight: '700' },
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#64748b' },
  loadingWrap: { paddingVertical: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  logCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
  },
  logTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  logId: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  timeText: { color: '#475569', fontSize: 12 },
  rowWrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  actionBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  actionBadgeText: { fontSize: 11, fontWeight: '700' },
  actorName: { fontSize: 12, color: '#1e293b', fontWeight: '600' },
  actorBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  actorBadgeText: { fontSize: 10, color: '#334155', fontWeight: '700' },
  actorAdmin: { backgroundColor: '#fee2e2' },
  actorTeacher: { backgroundColor: '#eef2ff' },
  actorStudent: { backgroundColor: '#eff6ff' },
  actorParent: { backgroundColor: '#f3e8ff' },
  actorDefault: { backgroundColor: '#e2e8f0' },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  modelTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    fontSize: 11,
    color: '#475569',
  },
  objectId: { fontSize: 11, color: '#94a3b8' },
  descriptionText: { marginTop: 6, fontSize: 12, color: '#475569' },
  ipText: { marginTop: 6, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  paginationWrap: { marginTop: 8, alignItems: 'center' },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  pageBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pageBtnActive: { backgroundColor: '#2563eb' },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { fontSize: 12, color: '#334155', fontWeight: '700' },
  pageBtnTextActive: { color: '#fff' },
  rangeText: { marginTop: 8, color: '#64748b', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 12,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '88%',
    padding: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  detailValue: { fontSize: 13, color: '#111827' },
  mono: { fontFamily: 'monospace' },
  descriptionLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, marginBottom: 4 },
  descriptionFull: {
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
  },
});

export default ActivityLogsTable;
