import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

const ActivityChart = ({ activityData = [] }) => {
    const maxMinutes = Math.max(...activityData.map((d) => d.minutes), 30);
    const isMobile = Dimensions.get('window').width <= 768;

    return (
        <View style={styles.activityChartContainer}>
            <View style={styles.headerRow}>
                <View style={styles.headerTitleWrap}>
                    <Bootstrap name="bar-chart-line" size={18} color="#4f46e5" />
                    <Text style={styles.headerTitle}>Weekly Activity</Text>
                </View>

                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, styles.legendDotMinutes]} />
                        <Text style={styles.legendText}>Minutes</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, styles.legendDotLessons]} />
                        <Text style={styles.legendText}>Lessons</Text>
                    </View>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <View style={styles.chartBars}>
                    {activityData.map((day, index) => {
                        const minutesHeight = `${(day.minutes / maxMinutes) * 100}%`;
                        const lessonsHeight = `${(day.lessons / 5) * 100}%`;

                        return (
                            <View key={index} style={styles.chartBarGroup}>
                                <View style={styles.dayBarsRow}>
                                    <View style={styles.chartBarWrapper}>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                styles.minutesBar,
                                                { height: minutesHeight, minHeight: day.minutes > 0 ? 10 : 0 },
                                                isMobile ? styles.chartBarMobile : null,
                                            ]}
                                        >
                                            {day.minutes > 0 && (
                                                <Text style={[styles.barValue, isMobile ? styles.barValueMobile : null]}>
                                                    {day.minutes}m
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.chartBarWrapper}>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                styles.lessonsBar,
                                                { height: lessonsHeight, minHeight: day.lessons > 0 ? 10 : 0 },
                                                isMobile ? styles.chartBarMobile : null,
                                            ]}
                                        >
                                            {day.lessons > 0 && (
                                                <Text style={[styles.barValue, isMobile ? styles.barValueMobile : null]}>
                                                    {day.lessons}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.chartLabel}>{day.date}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryValuePrimary]}>
                        {activityData.reduce((sum, d) => sum + d.minutes, 0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Minutes</Text>
                </View>

                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryValueSuccess]}>
                        {activityData.reduce((sum, d) => sum + d.lessons, 0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Lessons Completed</Text>
                </View>

                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryValueWarning]}>
                        {activityData.filter((d) => d.minutes > 0).length}
                    </Text>
                    <Text style={styles.summaryLabel}>Active Days</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    activityChartContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10,
    },
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 4,
    },
    legendDotMinutes: {
        backgroundColor: '#4f46e5',
    },
    legendDotLessons: {
        backgroundColor: '#10b981',
    },
    legendText: {
        fontSize: 12,
        color: '#6b7280',
    },
    chartContainer: {
        paddingVertical: 12,
    },
    chartBars: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        minHeight: 200,
        gap: 8,
    },
    chartBarGroup: {
        flex: 1,
        alignItems: 'center',
    },
    dayBarsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        minHeight: 150,
        width: '100%',
        gap: 4,
    },
    chartBarWrapper: {
        minHeight: 150,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    chartBar: {
        width: 20,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        position: 'relative',
    },
    chartBarMobile: {
        width: 15,
    },
    minutesBar: {
        backgroundColor: '#6366f1',
    },
    lessonsBar: {
        backgroundColor: '#34d399',
    },
    barValue: {
        position: 'absolute',
        top: -18,
        alignSelf: 'center',
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
    },
    barValueMobile: {
        fontSize: 10,
    },
    chartLabel: {
        marginTop: 8,
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    summaryRow: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 2,
    },
    summaryValuePrimary: {
        color: '#4f46e5',
    },
    summaryValueSuccess: {
        color: '#10b981',
    },
    summaryValueWarning: {
        color: '#f59e0b',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
    },
});

export default ActivityChart;
