import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../shared/LoadingSpinner';

const ACCESS_TYPE_OPTIONS = [
  'course_view',
  'lesson_view',
  'course_enroll',
  'course_unenroll',
  'download_material',
  'lesson_complete',
];

const AccessLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    access_type: '',
    was_allowed: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);

      if (filters.access_type) params.append('access_type', filters.access_type);
      if (filters.was_allowed) params.append('was_allowed', filters.was_allowed);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await axios.get(`${API_BASE_URL}/audit/access/?${params.toString()}`);
      const results = response.data.results || [];
      const count = response.data.count || 0;

      setLogs(results);
      setTotalCount(count);
      setTotalPages(Math.max(Math.ceil(count / 8), 1));
    } catch (error) {
      Alert.alert('Error', 'Failed to load access logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      access_type: '',
      was_allowed: '',
      date_from: '',
      date_to: '',
    });
    setCurrentPage(1);
  };

  const getAccessTypeLabel = (type) => {
    const labels = {
      course_view: 'Course View',
      lesson_view: 'Lesson View',
      course_enroll: 'Course Enrollment',
      course_unenroll: 'Course Unenrollment',
      download_material: 'Download Material',
      lesson_complete: 'Lesson Completed',
    };
    return labels[type] || type || 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '-';
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filters</Text>

          <TextInput
            style={styles.input}
            placeholder="Access Type (e.g. course_view)"
            value={filters.access_type}
            onChangeText={(value) => handleFilterChange('access_type', value)}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {ACCESS_TYPE_OPTIONS.map((type) => {
              const active = filters.access_type === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleFilterChange('access_type', active ? '' : type)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{getAccessTypeLabel(type)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TextInput
            style={styles.input}
            placeholder="Status (true/false)"
            value={filters.was_allowed}
            onChangeText={(value) => handleFilterChange('was_allowed', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="From Date (YYYY-MM-DD)"
            value={filters.date_from}
            onChangeText={(value) => handleFilterChange('date_from', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="To Date (YYYY-MM-DD)"
            value={filters.date_to}
            onChangeText={(value) => handleFilterChange('date_to', value)}
          />

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={fetchLogs}>
              <Text style={styles.primaryBtnText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleResetFilters}>
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner size="md" text="Loading access logs..." />
          </View>
        ) : (
          <>
            <Text style={styles.countText}>Showing {logs.length} of {totalCount} access logs</Text>

            {logs.length > 0 ? (
              logs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <Text style={styles.userText}>{log.user_display || 'Unknown'}</Text>
                  <Text style={styles.meta}>Type: {getAccessTypeLabel(log.access_type)}</Text>
                  <Text style={styles.meta}>Resource: {log.course_name || log.lesson_name || 'N/A'}</Text>

                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, log.was_allowed ? styles.allowedBadge : styles.deniedBadge]}>
                      <Text style={styles.statusText}>{log.was_allowed ? 'Allowed' : 'Denied'}</Text>
                    </View>
                    <Text style={styles.meta}>Duration: {formatDuration(log.duration_seconds)}</Text>
                  </View>

                  <Text style={[styles.meta, styles.mono]}>IP: {log.ip_address || 'N/A'}</Text>
                  <Text style={styles.meta}>Time: {formatDate(log.created_at)}</Text>

                  <TouchableOpacity style={styles.viewBtn} onPress={() => setSelectedLog(log)}>
                    <Text style={styles.viewBtnText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No access logs found</Text>
              </View>
            )}

            {totalPages > 1 && (
              <View style={styles.paginationWrap}>
                <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>
                <View style={styles.paginationButtons}>
                  <PageBtn label="First" disabled={currentPage === 1} onPress={() => setCurrentPage(1)} />
                  <PageBtn
                    label="Prev"
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  />
                  <PageBtn
                    label="Next"
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  />
                  <PageBtn
                    label="Last"
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage(totalPages)}
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!selectedLog} transparent animationType="fade" onRequestClose={() => setSelectedLog(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Access Log Details</Text>

            {selectedLog && (
              <ScrollView>
                <DetailRow label="User" value={selectedLog.user_display || 'Unknown'} />
                <DetailRow label="Access Type" value={getAccessTypeLabel(selectedLog.access_type)} />
                <DetailRow label="Status" value={selectedLog.was_allowed ? 'Allowed' : 'Denied'} />
                {selectedLog.denial_reason ? <DetailRow label="Denial Reason" value={selectedLog.denial_reason} /> : null}
                <DetailRow label="Course" value={selectedLog.course_name || 'N/A'} />
                <DetailRow label="Lesson" value={selectedLog.lesson_name || 'N/A'} />
                <DetailRow label="Duration" value={formatDuration(selectedLog.duration_seconds)} />
                <DetailRow label="IP Address" value={selectedLog.ip_address || 'N/A'} mono />
                <DetailRow label="Time" value={selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'} />
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

const DetailRow = ({ label, value, mono = false }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, mono && styles.mono]}>{value || 'N/A'}</Text>
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
  filterSection: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  filterTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#fff',
  },
  chipsRow: { marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  chipText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#1d4ed8' },
  filterActions: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#374151', fontSize: 12, fontWeight: '700' },
  loadingWrap: { paddingVertical: 20 },
  countText: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  logCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  userText: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 3 },
  meta: { marginTop: 3, fontSize: 12, color: '#6b7280' },
  mono: { fontFamily: 'monospace' },
  statusRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusBadge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  allowedBadge: { backgroundColor: '#dcfce7' },
  deniedBadge: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#1f2937' },
  viewBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  viewBtnText: { color: '#3730a3', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  paginationWrap: { marginTop: 8, alignItems: 'center' },
  pageInfo: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  paginationButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pageBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { fontSize: 12, color: '#374151', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 12,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '86%',
    padding: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  detailValue: { fontSize: 13, color: '#111827' },
});

export default AccessLogsTable;
