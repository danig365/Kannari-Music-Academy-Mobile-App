import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const StudyStudentMaterial = () => {
    const route = useRoute();
    const courseId = route?.params?.course_id || route?.params?.courseId || route?.params?.id;

    const [studyData, setStudyData] = useState([]);
    const [totalResult, setTotalResult] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudyMaterial = async () => {
            if (!courseId) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`${baseUrl}/study-material/${courseId}`);
                const materials = Array.isArray(res.data) ? res.data : [];
                setTotalResult(materials.length);
                setStudyData(materials);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudyMaterial();
    }, [courseId]);

    const downloadFile = async (fileUrl) => {
        if (!fileUrl) {
            Alert.alert('Unavailable', 'File URL is not available.');
            return;
        }

        try {
            await Linking.openURL(fileUrl);
        } catch {
            Alert.alert('Failed', 'Could not open file link.');
        }
    };

    return (

                <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Bootstrap name="book" size={16} color="#1f2937" />
                            <Text style={styles.cardHeaderText}>All study Materials ({totalResult})</Text>
                        </View>

                        {loading ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text style={styles.loadingText}>Loading materials...</Text>
                            </View>
                        ) : studyData.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Bootstrap name="journal-x" size={32} color="#9ca3af" />
                                <Text style={styles.emptyText}>No study materials found</Text>
                            </View>
                        ) : (
                            <View style={styles.materialsList}>
                                {studyData.map((row, index) => (
                                    <View key={row.id || index} style={styles.materialCard}>
                                        <View style={styles.rowBlock}>
                                            <Text style={styles.label}>Title</Text>
                                            <Text style={styles.value}>{row.title || '-'}</Text>
                                        </View>

                                        <View style={styles.rowBlock}>
                                            <Text style={styles.label}>Details</Text>
                                            <Text style={styles.value}>{row.description || '-'}</Text>
                                        </View>

                                        <View style={styles.rowBlock}>
                                            <Text style={styles.label}>Remarks</Text>
                                            <Text style={styles.value}>{row.remarks || '-'}</Text>
                                        </View>

                                        <TouchableOpacity style={styles.downloadBtn} onPress={() => downloadFile(row.upload)}>
                                            <Bootstrap name="download" size={13} color="#ffffff" />
                                            <Text style={styles.downloadBtnText}>Download Files</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
    );
};

const styles = StyleSheet.create({
    pageWrap: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
    },
    sidebarOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 999,
    },
    contentWrap: {
        flex: 1,
    },
    mobileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sidebarToggle: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59,130,246,0.08)',
        marginRight: 10,
    },
    logoMini: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
    },
    mainScroll: {
        flex: 1,
    },
    mainContent: {
        padding: 16,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    cardHeader: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardHeaderText: {
        color: '#1f2937',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingWrap: {
        paddingVertical: 26,
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        color: '#6b7280',
        fontSize: 13,
    },
    emptyWrap: {
        paddingVertical: 26,
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
    },
    materialsList: {
        padding: 12,
        gap: 12,
    },
    materialCard: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#ffffff',
    },
    rowBlock: {
        marginBottom: 8,
    },
    label: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    value: {
        color: '#1f2937',
        fontSize: 13,
        lineHeight: 18,
    },
    downloadBtn: {
        marginTop: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#16a34a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    downloadBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default StudyStudentMaterial;

