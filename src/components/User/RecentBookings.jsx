import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Linking,
    Alert,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';

const RecentBookings = ({ studentId }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, [studentId]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/lesson-bookings/?student_id=${studentId}&status=scheduled`);
            setBookings((response.data || []).slice(0, 3));
        } catch (error) {
            console.log('No bookings found');
        } finally {
            setLoading(false);
        }
    };

    const openMeetingLink = async (url) => {
        if (!url) return;
        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert('Unable to open link', 'Please try again later.');
        }
    };

    const formatDate = (dateValue) => {
        return new Date(dateValue).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={[styles.card, styles.loadingCard]}>
                <ActivityIndicator size="small" color="#ea4335" />
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerRow}>
                    <Bootstrap name="calendar3" size={16} color="#ffffff" />
                    <Text style={styles.headerText}>Upcoming Lessons</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                {bookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Bootstrap name="calendar-x" size={32} color="#9ca3af" />
                        <Text style={styles.emptyText}>No upcoming lessons scheduled</Text>
                    </View>
                ) : (
                    <View>
                        {bookings.map((booking) => (
                            <View key={booking.id} style={styles.lessonItem}>
                                <View style={styles.lessonTopRow}>
                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                        <View style={styles.teacherRow}>
                                            <Bootstrap name="person-circle" size={14} color="#2563eb" />
                                            <Text style={styles.teacherName}>
                                            {booking.teacher_name}
                                            </Text>
                                        </View>

                                        <View style={styles.dateRow}>
                                            <Bootstrap name="calendar-event" size={12} color="#6b7280" />
                                            <Text style={styles.metaText}>{formatDate(booking.scheduled_date)}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.badge, { backgroundColor: getStatusColor(booking.status) }]}>
                                        <Text style={styles.badgeText}>
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.timeRow}>
                                    <Bootstrap name="clock" size={12} color="#6b7280" />
                                    <Text style={styles.metaText}>
                                        {booking.scheduled_time} ({booking.duration_minutes} min)
                                    </Text>
                                </View>

                                {booking.meeting_link && (
                                    <TouchableOpacity style={styles.meetingLinkRow} onPress={() => openMeetingLink(booking.meeting_link)}>
                                        <Bootstrap name="link-45deg" size={13} color="#2563eb" />
                                        <Text style={styles.meetingLinkText}>Join Meeting</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'scheduled': return '#0ea5e9';
        case 'completed': return '#10b981';
        case 'cancelled': return '#ef4444';
        default: return '#6b7280';
    }
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    loadingCard: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 160,
    },
    cardHeader: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#ea4335',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    cardBody: {
        padding: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    emptyText: {
        marginTop: 8,
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
    },
    lessonItem: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    lessonTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    teacherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    teacherName: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        color: '#6b7280',
        fontSize: 12,
    },
    badge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    meetingLinkRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    meetingLinkText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default RecentBookings;
