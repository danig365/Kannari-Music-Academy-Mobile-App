import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
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

const PaymentLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    payment_type: '',
    status: '',
    search: '',
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

      if (filters.payment_type) params.append('payment_type', filters.payment_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await axios.get(`${API_BASE_URL}/audit/payments/?${params.toString()}`);

      const results = response.data.results || [];
      const count = response.data.count || 0;
      const pages = Math.max(Math.ceil(count / 8), 1);

      setLogs(results);
      setTotalCount(count);
      setTotalPages(pages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      payment_type: '',
      status: '',
      search: '',
      date_from: '',
      date_to: '',
    });
    setCurrentPage(1);
  };

  const getStatusStyle = (status) => {
    if (status === 'completed') return styles.statusSuccess;
    if (status === 'failed') return styles.statusFailed;
    if (status === 'pending') return styles.statusPending;
    if (status === 'refunded') return styles.statusRefunded;
    return styles.statusNeutral;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatAmount = (amount) => {
    if (typeof amount === 'number') return amount.toFixed(2);
    return parseFloat(amount || 0).toFixed(2);
  };

  const openReceipt = async (url) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Error', 'Unable to open receipt URL.');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filters</Text>

          <TextInput
            style={styles.input}
            placeholder="Payment Type (e.g. renewal)"
            value={filters.payment_type}
            onChangeText={(value) => handleFilterChange('payment_type', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Status (completed/failed/pending/refunded/cancelled)"
            value={filters.status}
            onChangeText={(value) => handleFilterChange('status', value)}
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

          <TextInput
            style={styles.input}
            placeholder="Search transaction ID..."
            value={filters.search}
            onChangeText={(value) => handleFilterChange('search', value)}
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
            <LoadingSpinner size="md" text="Loading payment logs..." />
          </View>
        ) : (
          <>
            <Text style={styles.countText}>Showing {logs.length} of {totalCount} payments</Text>

            {logs.length > 0 ? (
              logs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logRowTop}>
                    <Text style={styles.txnId} numberOfLines={1}>
                      {log.transaction_id}
                    </Text>
                    <View style={[styles.statusBadge, getStatusStyle(log.status)]}>
                      <Text style={styles.statusText}>{log.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.meta}>Student: {log.student_name || 'N/A'}</Text>
                  <Text style={styles.meta}>Plan: {log.subscription_plan_name || 'N/A'}</Text>
                  <Text style={styles.meta}>Amount: ${formatAmount(log.final_amount)}</Text>
                  <Text style={styles.meta}>Type: {(log.payment_type || 'N/A').replace('_', ' ')}</Text>
                  <Text style={styles.meta}>Method: {log.payment_method || 'N/A'}</Text>
                  <Text style={styles.meta}>Date: {formatDate(log.created_at)}</Text>

                  <TouchableOpacity style={styles.viewBtn} onPress={() => setSelectedLog(log)}>
                    <Text style={styles.viewBtnText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No payment logs found</Text>
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

      <Modal
        visible={!!selectedLog}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLog(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Payment Log Details</Text>

            {selectedLog && (
              <ScrollView>
                <DetailRow label="Transaction ID" value={selectedLog.transaction_id} mono />
                <DetailRow label="Student" value={selectedLog.student_name} />
                <DetailRow label="Plan" value={selectedLog.subscription_plan_name || 'N/A'} />
                <DetailRow label="Payment Type" value={selectedLog.payment_type?.replace('_', ' ')} />
                <DetailRow label="Status" value={selectedLog.status} />
                <DetailRow label="Amount" value={`$${formatAmount(selectedLog.final_amount)}`} />
                <DetailRow label="Tax" value={`$${formatAmount(selectedLog.tax_amount)}`} />
                <DetailRow label="Discount" value={`$${formatAmount(selectedLog.discount_amount)}`} />
                <DetailRow label="Payment Method" value={selectedLog.payment_method || 'N/A'} />
                <DetailRow label="Email" value={selectedLog.user_email || 'N/A'} />
                <DetailRow label="IP Address" value={selectedLog.user_ip_address || 'N/A'} />
                <DetailRow label="Processed At" value={new Date(selectedLog.created_at).toLocaleString()} />
                <DetailRow
                  label="Completed At"
                  value={selectedLog.completed_at ? new Date(selectedLog.completed_at).toLocaleString() : 'N/A'}
                />
                {selectedLog.invoice_number ? <DetailRow label="Invoice" value={selectedLog.invoice_number} /> : null}
                {selectedLog.error_message ? <DetailRow label="Error" value={selectedLog.error_message} /> : null}
                {selectedLog.error_code ? <DetailRow label="Error Code" value={selectedLog.error_code} /> : null}

                {selectedLog.receipt_url ? (
                  <TouchableOpacity style={styles.receiptBtn} onPress={() => openReceipt(selectedLog.receipt_url)}>
                    <Text style={styles.receiptBtnText}>Open Receipt</Text>
                  </TouchableOpacity>
                ) : null}
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
  filterActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
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
  logRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  txnId: { flex: 1, fontSize: 12, fontWeight: '700', color: '#1f2937' },
  meta: { marginTop: 3, fontSize: 12, color: '#6b7280' },

  statusBadge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  statusSuccess: { backgroundColor: '#dcfce7' },
  statusFailed: { backgroundColor: '#fee2e2' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusRefunded: { backgroundColor: '#dbeafe' },
  statusNeutral: { backgroundColor: '#e5e7eb' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#1f2937', textTransform: 'capitalize' },

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
    maxHeight: '88%',
    padding: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  detailValue: { fontSize: 13, color: '#111827' },
  mono: { fontFamily: 'monospace' },

  receiptBtn: {
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  receiptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default PaymentLogsTable;
