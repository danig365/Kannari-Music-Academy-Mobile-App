import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const AuditSummary = ({ data }) => {
  if (!data) return null;
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  const { uploads = {}, payments = {}, access = {} } = data;

  const paymentStatusItems = [
    { label: 'Completed', value: payments?.completed || 0, color: '#28a745' },
    { label: 'Failed', value: payments?.failed || 0, color: '#dc3545' },
    { label: 'Pending', value: payments?.pending || 0, color: '#ffc107' },
    { label: 'Refunded', value: payments?.refunded || 0, color: '#17a2b8' },
  ];

  const uploadStatusItems = [
    { label: 'Successful', value: uploads?.successful || 0, color: '#28a745' },
    { label: 'Failed', value: uploads?.failed || 0, color: '#dc3545' },
    {
      label: 'Pending',
      value: Math.max((uploads?.total || 0) - (uploads?.successful || 0) - (uploads?.failed || 0), 0),
      color: '#ffc107',
    },
  ];

  const paymentTypeData = payments?.by_type || [];
  const denialReasons = access?.denial_reasons || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryCards}>
        <MetricCard
          isCompact={isCompact}
          icon="☁️"
          label="Total Uploads"
          value={uploads?.total || 0}
          subText={`Success rate: ${(uploads?.success_rate || 0).toFixed(1)}%`}
          topColor="#28a745"
        />
        <MetricCard
          isCompact={isCompact}
          icon="✅"
          label="Successful"
          value={uploads?.successful || 0}
          subText={`Last 7 days: ${uploads?.recent_7_days || 0}`}
          topColor="#28a745"
        />
        <MetricCard
          isCompact={isCompact}
          icon="⚠️"
          label="Failed"
          value={uploads?.failed || 0}
          subText="Need attention"
          topColor="#dc3545"
        />
        <MetricCard
          isCompact={isCompact}
          icon="💳"
          label="Total Revenue"
          value={`$${(payments?.total_revenue || 0).toLocaleString()}`}
          subText={`Completed: ${payments?.completed || 0}`}
          topColor="#28a745"
        />
        <MetricCard
          isCompact={isCompact}
          icon="%"
          label="Success Rate"
          value={`${(payments?.success_rate || 0).toFixed(1)}%`}
          subText={`Failed: ${payments?.failed || 0}`}
          topColor="#0d6efd"
        />
        <MetricCard
          isCompact={isCompact}
          icon="🚪"
          label="Total Access"
          value={access?.total || 0}
          subText={`Last 7 days: ${access?.recent_7_days || 0}`}
          topColor="#17a2b8"
        />
        <MetricCard
          isCompact={isCompact}
          icon="✔️"
          label="Access Allowed"
          value={access?.allowed || 0}
          subText={`Rate: ${(access?.allow_rate || 0).toFixed(1)}%`}
          topColor="#28a745"
        />
        <MetricCard
          isCompact={isCompact}
          icon="⛔"
          label="Access Denied"
          value={access?.denied || 0}
          subText={`Rate: ${(100 - (access?.allow_rate || 0)).toFixed(1)}%`}
          topColor="#dc3545"
        />
      </View>

      <Text style={styles.sectionTitle}>Payment Status Distribution</Text>
      <SimpleDistributionCard items={paymentStatusItems} />

      <Text style={styles.sectionTitle}>Upload Status Distribution</Text>
      <SimpleDistributionCard items={uploadStatusItems} />

      <Text style={styles.sectionTitle}>Payment Types</Text>
      <View style={styles.card}>
        {paymentTypeData.length > 0 ? (
          paymentTypeData.map((item, index) => (
            <BarRow
              key={index}
              label={item.payment_type?.replace('_', ' ') || 'Other'}
              value={item.count || 0}
              total={Math.max(...paymentTypeData.map((x) => x.count || 0), 1)}
              color="#0d6efd"
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No payment type data</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Access Denial Reasons</Text>
      <View style={styles.card}>
        {denialReasons.length > 0 ? (
          denialReasons.map((reason, index) => (
            <View key={index} style={styles.reasonRow}>
              <Text style={styles.reasonText}>{reason.denial_reason || 'Unknown'}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reason.count}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No denials recorded</Text>
        )}
      </View>

      {payments?.by_method?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <View style={styles.card}>
            {payments.by_method.map((method, index) => (
              <View key={index} style={styles.methodRow}>
                <View>
                  <Text style={styles.methodTitle}>{method.payment_method}</Text>
                  <Text style={styles.methodSub}>
                    {((method.count / (payments?.total || 1)) * 100).toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.methodCount}>{method.count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {uploads?.by_type?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Upload Types</Text>
          <View style={styles.card}>
            {uploads.by_type.map((type, index) => (
              <View key={index} style={styles.methodRow}>
                <View>
                  <Text style={styles.methodTitle}>{type.upload_type?.replace('_', ' ')}</Text>
                  <Text style={styles.methodSub}>
                    {((type.count / (uploads?.total || 1)) * 100).toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.methodCount}>{type.count}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const MetricCard = ({ icon, label, value, subText, topColor, isCompact }) => (
  <View style={[styles.metricCard, isCompact ? styles.metricCardCompact : styles.metricCardWide]}> 
    <View style={[styles.metricAccent, { backgroundColor: topColor }]} />
    <View style={styles.metricIconWrap}>
      <Text style={styles.metricIcon}>{icon}</Text>
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricSub}>{subText}</Text>
  </View>
);

const SimpleDistributionCard = ({ items }) => {
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1;

  return (
    <View style={styles.card}>
      {items.map((item, index) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <View key={index} style={styles.distRow}>
            <Text style={styles.distLabel}>{item.label}</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distFill, { width: `${pct}%`, backgroundColor: item.color }]} />
            </View>
            <Text style={styles.distValue}>{item.value}</Text>
            <Text style={styles.distPct}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
};

const BarRow = ({ label, value, total, color }) => {
  const pct = Math.max(4, Math.round((value / total) * 100));
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexGrow: 1,
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricCardCompact: {
    width: '100%',
  },
  metricCardWide: {
    width: '48.5%',
  },
  metricAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    fontSize: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    letterSpacing: 0.2,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a2332',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2332',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eef1f5',
    padding: 10,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distLabel: {
    width: 86,
    fontSize: 12,
    color: '#374151',
  },
  distTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  distFill: {
    height: '100%',
    borderRadius: 8,
  },
  distValue: {
    width: 28,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a2332',
    textAlign: 'right',
  },
  distPct: {
    width: 36,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  barRow: {
    marginBottom: 10,
  },
  barLabel: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  barTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barValue: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a2332',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#dc3545',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 12,
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  methodSub: {
    marginTop: 2,
    fontSize: 11,
    color: '#6b7280',
  },
  methodCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2332',
  },
  emptyText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default AuditSummary;
