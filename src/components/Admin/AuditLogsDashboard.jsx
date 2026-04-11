import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../shared/LoadingSpinner';
import AuditSummary from './AuditSummary';
import UploadLogsTable from './UploadLogsTable';
import PaymentLogsTable from './PaymentLogsTable';
import AccessLogsTable from './AccessLogsTable';
import MessageLogsTable from './MessageLogsTable';
import ActivityLogsTable from './ActivityLogsTable';

const TABS = [
  { key: 'summary', label: 'Summary & Analytics', countKey: null },
  { key: 'uploads', label: 'Upload Logs', countKey: 'uploads' },
  { key: 'payments', label: 'Payment Logs', countKey: 'payments' },
  { key: 'access', label: 'Access Logs', countKey: 'access' },
  { key: 'messages', label: 'Messages', countKey: 'messages' },
  { key: 'activity', label: 'Activity Logs', countKey: 'activity' },
];

const AuditLogsDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/audit/summary/`);
      if (response.data.bool) {
        setSummaryData(response.data.summary);
      }
    } catch (err) {
      setError('Failed to load audit summary data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchSummary();
  };

  const handleExport = async (logType) => {
    try {
      setError(null);
      const exportUrl = `${API_BASE_URL}/audit/export/${logType}/`;
      const supported = await Linking.canOpenURL(exportUrl);
      if (!supported) {
        setError('Unable to open export URL on this device');
        return;
      }
      await Linking.openURL(exportUrl);
    } catch (err) {
      setError('Failed to export logs');
      Alert.alert('Export Failed', 'Unable to export logs on this device.');
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'summary' && summaryData) return <AuditSummary data={summaryData} />;
    if (activeTab === 'uploads') return <UploadLogsTable key={`uploads-${refreshKey}`} />;
    if (activeTab === 'payments') return <PaymentLogsTable key={`payments-${refreshKey}`} />;
    if (activeTab === 'access') return <AccessLogsTable key={`access-${refreshKey}`} />;
    if (activeTab === 'messages') return <MessageLogsTable key={`messages-${refreshKey}`} />;
    if (activeTab === 'activity') return <ActivityLogsTable key={`activity-${refreshKey}`} />;
    return null;
  };

  const getCount = (countKey) => {
    if (!summaryData || !countKey || !summaryData[countKey]) return null;
    return summaryData[countKey].total || 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Audit Logs Dashboard</Text>
          <Text style={styles.subtitle}>Track all user access, file uploads, and payment transactions</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleRefresh} disabled={loading} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('uploads')}>
              <Text style={styles.exportBtnText}>Uploads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('payments')}>
              <Text style={styles.exportBtnText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('access')}>
              <Text style={styles.exportBtnText}>Access</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner size="md" text="Loading audit logs data..." />
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                const count = getCount(tab.countKey);
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabBtn, active && styles.tabBtnActive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                    {count !== null ? (
                      <View style={[styles.badge, active && styles.badgeActive]}>
                        <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.tabContent}>{renderTabContent()}</View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 12, paddingBottom: 24 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  exportBtn: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  exportBtnText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: '#b91c1c', fontSize: 12, flex: 1 },
  dismissText: { color: '#7f1d1d', fontSize: 12, fontWeight: '700' },
  loadingWrap: { paddingVertical: 24 },
  tabsRow: { marginBottom: 10 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  tabText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#1d4ed8' },
  badge: {
    marginLeft: 6,
    minWidth: 20,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  badgeActive: { backgroundColor: '#bfdbfe' },
  badgeText: { fontSize: 11, color: '#334155', fontWeight: '700' },
  badgeTextActive: { color: '#1e3a8a' },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
  },
});

export default AuditLogsDashboard;
