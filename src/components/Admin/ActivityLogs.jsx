import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const ACTION_OPTIONS = ['login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import'];

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [currentPage, filterAction]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            let url = `${baseUrl}/activity-logs/?page=${currentPage}`;
            if (filterAction) {
                url += `&action=${filterAction}`;
            }
            const response = await axios.get(url);

            if (response.data.results) {
                const count = response.data.count || 0;
                setLogs(response.data.results);
                setTotalPages(Math.max(Math.ceil(count / 8), 1));
            } else {
                const rows = Array.isArray(response.data) ? response.data : [];
                setLogs(rows);
                setTotalPages(1);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch activity logs');
        } finally {
            setLoading(false);
        }
    };

    const actionStyle = (action) => {
        const actionColors = {
            login: '#dcfce7',
            logout: '#f3f4f6',
            create: '#dbeafe',
            update: '#e0f2fe',
            delete: '#fee2e2',
            view: '#f9fafb',
            export: '#f3e8ff',
            import: '#dbeafe',
        };
        const actionTextColors = {
            login: '#15803d',
            logout: '#4b5563',
            create: '#1e40af',
            update: '#0369a1',
            delete: '#b91c1c',
            view: '#374151',
            export: '#6b21a8',
            import: '#1e40af',
        };

        return {
            backgroundColor: actionColors[action] || '#f3f4f6',
            color: actionTextColors[action] || '#4b5563',
        };
    };

    const pageItems = useMemo(() => {
        return Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
    }, [totalPages]);

    if (loading) {
        return (
            <View style={styles.loadingWrapper}>
                <LoadingSpinner size="lg" text="Loading activity logs..." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Activity Logs</Text>
                    <Text style={styles.subtitle}>Track and monitor all administrative activities.</Text>
                </View>

                <View style={styles.filterCard}>
                    <Text style={styles.filterLabel}>Filter by Action</Text>

                    <TextInput
                        style={styles.input}
                        value={filterAction}
                        onChangeText={(value) => {
                            setFilterAction(value);
                            setCurrentPage(1);
                        }}
                        placeholder="Type action (login, create, delete...)"
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                        {ACTION_OPTIONS.map((action) => {
                            const active = filterAction === action;
                            return (
                                <TouchableOpacity
                                    key={action}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => {
                                        setFilterAction(active ? '' : action);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{action}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => {
                            setFilterAction('');
                            setCurrentPage(1);
                        }}
                    >
                        <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.logsCard}>
                    {logs.length > 0 ? (
                        logs.map((log, index) => {
                            const style = actionStyle(log.action);
                            const actor = log.admin?.full_name || log.teacher?.full_name || log.student?.fullname || 'System';

                            return (
                                <View key={log.id || index} style={styles.timelineItem}>
                                    <View style={[styles.timelineBadge, { backgroundColor: style.backgroundColor }]}> 
                                        <Text style={[styles.timelineBadgeText, { color: style.color }]}>{(log.action || '?').slice(0, 1).toUpperCase()}</Text>
                                    </View>

                                    <View style={styles.timelineContent}>
                                        <View style={styles.timelineHeader}>
                                            <View style={styles.headerLeft}>
                                                <Text style={styles.actionText}>{log.action || 'unknown'}</Text>
                                                {log.model_name ? <Text style={styles.actionDetail}>on {log.model_name}</Text> : null}
                                                {log.object_id ? <Text style={styles.actionDetail}>#{log.object_id}</Text> : null}
                                            </View>
                                            <Text style={styles.timeText}>{new Date(log.created_at).toLocaleString()}</Text>
                                        </View>

                                        {log.description ? <Text style={styles.description}>{log.description}</Text> : null}

                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaText}>User: {actor}</Text>
                                            {log.ip_address ? <Text style={styles.metaText}>IP: {log.ip_address}</Text> : null}
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No activity logs found.</Text>
                        </View>
                    )}

                    {totalPages > 1 ? (
                        <View style={styles.paginationWrapper}>
                            <View style={styles.paginationList}>
                                <PageBtn
                                    label="Previous"
                                    disabled={currentPage === 1}
                                    onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                />

                                {pageItems.map((pageNum) => (
                                    <TouchableOpacity
                                        key={pageNum}
                                        style={[styles.pageBtn, currentPage === pageNum && styles.pageBtnActive]}
                                        onPress={() => setCurrentPage(pageNum)}
                                    >
                                        <Text style={[styles.pageBtnText, currentPage === pageNum && styles.pageBtnTextActive]}>{pageNum}</Text>
                                    </TouchableOpacity>
                                ))}

                                <PageBtn
                                    label="Next"
                                    disabled={currentPage === totalPages}
                                    onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                />
                            </View>
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </View>
    );
};

const PageBtn = ({ label, disabled, onPress }) => (
    <TouchableOpacity style={[styles.pageBtn, disabled && styles.pageBtnDisabled]} disabled={disabled} onPress={onPress}>
        <Text style={styles.pageBtnText}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 12, paddingBottom: 24 },
    loadingWrapper: { flex: 1, justifyContent: 'center', paddingVertical: 30 },
    header: { marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#6b7280' },
    filterCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        marginBottom: 12,
    },
    filterLabel: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#f9fafb',
        paddingVertical: 8,
        paddingHorizontal: 10,
        fontSize: 13,
        color: '#111827',
        marginBottom: 8,
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
    chipText: { color: '#374151', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    chipTextActive: { color: '#1d4ed8' },
    clearBtn: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#2563eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    clearBtnText: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
    logsCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
    },
    timelineItem: {
        flexDirection: 'row',
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    timelineBadge: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    timelineBadgeText: { fontSize: 14, fontWeight: '700' },
    timelineContent: { flex: 1 },
    timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
    headerLeft: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, flex: 1 },
    actionText: { fontSize: 13, fontWeight: '700', color: '#1f2937', textTransform: 'capitalize' },
    actionDetail: { fontSize: 12, color: '#6b7280' },
    timeText: { fontSize: 11, color: '#9ca3af' },
    description: { fontSize: 12, color: '#4b5563', marginBottom: 6 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metaText: { fontSize: 11, color: '#6b7280' },
    emptyState: { alignItems: 'center', paddingVertical: 20 },
    emptyText: { color: '#6b7280', fontSize: 13 },
    paginationWrapper: { marginTop: 8 },
    paginationList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
    pageBtn: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
        backgroundColor: '#fff',
    },
    pageBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    pageBtnDisabled: { opacity: 0.45 },
    pageBtnText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
    pageBtnTextActive: { color: '#fff' },
});

export default ActivityLogs;
