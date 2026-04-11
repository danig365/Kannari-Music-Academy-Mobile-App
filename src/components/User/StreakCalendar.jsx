import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const StreakCalendar = ({ studentId }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 480;
    const [streakData, setStreakData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredDate, setHoveredDate] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchStreakData();
        }
    }, [studentId]);

    const fetchStreakData = async () => {
        try {
            const response = await axios.get(`${baseUrl}/student/streak-calendar/${studentId}/`);
            setStreakData(response.data);
        } catch (error) {
            console.error('Error fetching streak data:', error);
            setStreakData({
                calendar_data: {},
                current_streak: 0,
                longest_streak: 0,
                total_active_days: 0,
                this_week_active: 0,
                today: new Date().toISOString().split('T')[0],
                start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        } finally {
            setLoading(false);
        }
    };

    const getActivityLevel = (dateStr) => {
        if (!streakData?.calendar_data) return 0;
        return streakData.calendar_data[dateStr] || 0;
    };

    const getActivityColor = (level) => {
        const colors = {
            0: '#ebedf0',
            1: '#9be9a8',
            2: '#40c463',
            3: '#30a14e',
            4: '#216e39'
        };
        return colors[level] || colors[0];
    };

    const getActivityLabel = (level) => {
        const labels = {
            0: 'No activity',
            1: 'Light activity',
            2: 'Moderate activity',
            3: 'High activity',
            4: 'Very high activity'
        };
        return labels[level] || labels[0];
    };

    const generateCalendarWeeks = () => {
        if (!streakData) return [];

        const weeks = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 77);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        for (let week = 0; week < 12; week++) {
            const days = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + (week * 7) + day);
                const dateStr = currentDate.toISOString().split('T')[0];
                const isFuture = currentDate > today;
                const isToday = dateStr === today.toISOString().split('T')[0];

                days.push({
                    date: dateStr,
                    level: isFuture ? -1 : getActivityLevel(dateStr),
                    isToday,
                    isFuture,
                    displayDate: currentDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    })
                });
            }
            weeks.push(days);
        }

        return weeks;
    };

    const getMonthLabels = () => {
        const months = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 77);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        let lastMonth = -1;
        for (let week = 0; week < 12; week++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (week * 7));
            const month = weekStart.getMonth();

            if (month !== lastMonth) {
                months.push({
                    week,
                    label: weekStart.toLocaleDateString('en-US', { month: 'short' })
                });
                lastMonth = month;
            }
        }
        return months;
    };

    if (loading) {
        return (
            <View style={[styles.streakCalendarCard, styles.loadingCard]}>
                <LoadingSpinner size="sm" />
            </View>
        );
    }

    const weeks = generateCalendarWeeks();
    const monthLabels = getMonthLabels();

    return (
        <View style={styles.streakCalendarCard}>
            <View style={[styles.streakHeader, isMobile ? styles.streakHeaderMobile : null]}>
                <View style={[styles.streakTitle, isMobile ? styles.streakTitleMobile : null]}>
                    <Bootstrap name="fire" size={24} color="#FF6B6B" />
                    <Text style={styles.streakTitleText}>Learning Streak</Text>
                </View>
                <View style={[styles.streakStats, isMobile ? styles.streakStatsMobile : null]}>
                    <View style={[styles.streakStat, styles.streakStatCurrent, isMobile ? styles.streakStatMobile : null]}>
                        <Text style={styles.streakNumber}>{streakData?.current_streak || 0}</Text>
                        <Text style={styles.streakLabel}>Current</Text>
                        {streakData?.current_streak > 0 && (
                            <Text style={styles.emojiTopRight}>🔥</Text>
                        )}
                    </View>
                    <View style={[styles.streakStat, styles.streakStatBest, isMobile ? styles.streakStatMobile : null]}>
                        <Text style={styles.streakNumber}>{streakData?.longest_streak || 0}</Text>
                        <Text style={styles.streakLabel}>Best</Text>
                        <Text style={styles.emojiTopRight}>🏆</Text>
                    </View>
                </View>
            </View>

            <View style={styles.activitySummary}>
                <View style={styles.activityStat}>
                    <Bootstrap name="calendar-check" size={16} color="#4ECB71" />
                    <Text style={styles.activityText}>{streakData?.total_active_days || 0} active days</Text>
                </View>
                <View style={styles.activityStat}>
                    <Bootstrap name="calendar-week" size={16} color="#4ECB71" />
                    <Text style={styles.activityText}>{streakData?.this_week_active || 0}/7 this week</Text>
                </View>
            </View>

            <View style={styles.calendarContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        <View style={styles.monthLabelsRow}>
                            <View style={styles.monthLabelSpacer} />
                            <View style={styles.monthLabelsTrack}>
                                {monthLabels.map((m, i) => (
                                    <Text
                                        key={i}
                                        style={[styles.monthLabel, { marginLeft: i === 0 ? m.week * 15 : (m.week - monthLabels[i - 1].week) * 15 }]}
                                    >
                                        {m.label}
                                    </Text>
                                ))}
                            </View>
                        </View>

                        <View style={styles.calendarGrid}>
                            <View style={styles.dayLabels}>
                                <Text style={styles.dayLabelText}></Text>
                                <Text style={styles.dayLabelText}>Mon</Text>
                                <Text style={styles.dayLabelText}></Text>
                                <Text style={styles.dayLabelText}>Wed</Text>
                                <Text style={styles.dayLabelText}></Text>
                                <Text style={styles.dayLabelText}>Fri</Text>
                                <Text style={styles.dayLabelText}></Text>
                            </View>

                            <View style={styles.calendarWeeks}>
                                {weeks.map((week, weekIndex) => (
                                    <View key={weekIndex} style={styles.calendarWeek}>
                                        {week.map((day) => (
                                            <TouchableOpacity
                                                key={day.date}
                                                onPress={() => !day.isFuture && setHoveredDate(day)}
                                                activeOpacity={day.isFuture ? 1 : 0.8}
                                                style={[
                                                    styles.calendarCell,
                                                    day.isFuture ? styles.calendarCellFuture : null,
                                                    day.isToday ? styles.calendarCellToday : null,
                                                    {
                                                        backgroundColor: day.isFuture ? 'transparent' : getActivityColor(day.level),
                                                        borderColor: day.isToday ? '#4285f4' : 'transparent'
                                                    }
                                                ]}
                                            >
                                                {day.isToday && <View style={styles.todayDot} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.calendarLegend}>
                    <Text style={styles.legendLabel}>Less</Text>
                    {[0, 1, 2, 3, 4].map(level => (
                        <View
                            key={level}
                            style={[styles.legendCell, { backgroundColor: getActivityColor(level) }]}
                        />
                    ))}
                    <Text style={styles.legendLabel}>More</Text>
                </View>
            </View>

            {hoveredDate && (
                <View style={styles.calendarTooltip}>
                    <Text style={styles.tooltipStrong}>{hoveredDate.displayDate}</Text>
                    <Text style={styles.tooltipSpan}>{getActivityLabel(hoveredDate.level)}</Text>
                </View>
            )}

            {streakData?.current_streak > 0 ? (
                <View style={styles.streakMotivation}>
                    <Text style={styles.motivationEmoji}>⚡</Text>
                    <Text style={styles.streakMotivationText}>
                        {streakData.current_streak >= 7
                            ? "Amazing! You're on fire! Keep this streak going!"
                            : streakData.current_streak >= 3
                                ? "Great progress! You're building a habit!"
                                : 'Good start! Keep learning daily!'}
                    </Text>
                </View>
            ) : (
                <View style={[styles.streakMotivation, styles.streakMotivationStart]}>
                    <Text style={styles.motivationEmoji}>🎯</Text>
                    <Text style={styles.streakMotivationStartText}>Start your learning streak today!</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    streakCalendarCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        color: '#111827',
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    loadingCard: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
    },
    streakHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    streakHeaderMobile: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
    },
    streakTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    streakTitleMobile: {
        width: '100%',
    },
    streakTitleText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    streakStats: {
        flexDirection: 'row',
        gap: 16,
    },
    streakStatsMobile: {
        width: '100%',
        gap: 10,
    },
    streakStat: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        position: 'relative',
        minWidth: 70,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    streakStatMobile: {
        flex: 1,
        minWidth: 0,
    },
    streakStatCurrent: {
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    streakStatBest: {
        backgroundColor: 'rgba(255, 193, 7, 0.08)',
        borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    streakNumber: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 28,
        color: '#FF6B6B',
    },
    streakLabel: {
        fontSize: 11,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    emojiTopRight: {
        position: 'absolute',
        top: -8,
        right: -8,
        fontSize: 16,
    },
    activitySummary: {
        flexDirection: 'row',
        gap: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activityStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activityText: {
        fontSize: 13,
        color: '#374151',
    },
    calendarContainer: {
        marginBottom: 16,
    },
    monthLabelsRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    monthLabelSpacer: {
        width: 40,
    },
    monthLabelsTrack: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 14,
    },
    monthLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    calendarGrid: {
        flexDirection: 'row',
        gap: 4,
    },
    dayLabels: {
        flexDirection: 'column',
        gap: 2,
        marginRight: 4,
    },
    dayLabelText: {
        height: 12,
        fontSize: 10,
        color: '#9CA3AF',
        textAlignVertical: 'center',
    },
    calendarWeeks: {
        flexDirection: 'row',
        gap: 3,
        paddingBottom: 4,
    },
    calendarWeek: {
        flexDirection: 'column',
        gap: 3,
    },
    calendarCell: {
        width: 12,
        height: 12,
        borderRadius: 3,
        position: 'relative',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    calendarCellToday: {
        shadowColor: '#4285F4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 1,
    },
    calendarCellFuture: {
        opacity: 0.2,
    },
    todayDot: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -2,
        marginLeft: -2,
        width: 4,
        height: 4,
        backgroundColor: '#4285f4',
        borderRadius: 2,
    },
    calendarLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        marginTop: 12,
    },
    legendLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginHorizontal: 4,
    },
    legendCell: {
        width: 12,
        height: 12,
        borderRadius: 3,
    },
    calendarTooltip: {
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: [{ translateX: -60 }],
        backgroundColor: '#111827',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        zIndex: 100,
        minWidth: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    tooltipStrong: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    tooltipSpan: {
        color: '#D1D5DB',
        fontSize: 12,
    },
    streakMotivation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(76, 175, 80, 0.08)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    streakMotivationStart: {
        backgroundColor: 'rgba(66, 133, 244, 0.08)',
        borderColor: 'rgba(66, 133, 244, 0.3)',
    },
    motivationEmoji: {
        fontSize: 20,
    },
    streakMotivationText: {
        fontSize: 13,
        color: '#065F46',
        flex: 1,
    },
    streakMotivationStartText: {
        fontSize: 13,
        color: '#1E3A8A',
        flex: 1,
    },
});

export default StreakCalendar;
