import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  getAdminGamesAnalytics,
  exportAdminGameStatsCSV,
  exportAdminTopStudentsCSV,
} from '../../services/gameService';
import { API_BASE } from '../../api/endpoints';

const GAME_ICONS = { note_ninja: '🎵', rhythm_rush: '🥁', music_challenge: '⚡' };
const GAME_COLORS = {
  note_ninja: { bg: 'rgba(99,102,241,0.12)', fg: '#6366f1' },
  rhythm_rush: { bg: 'rgba(236,72,153,0.12)', fg: '#ec4899' },
  music_challenge: { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b' },
};
const BADGE_ICONS = { note_master: '🎵', rhythm_king: '🥁', theory_champion: '⚡' };

const rankStyle = (i) => {
  if (i === 0) return styles.rankGold;
  if (i === 1) return styles.rankSilver;
  if (i === 2) return styles.rankBronze;
  return styles.rankNormal;
};

const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const formatTime = (seconds = 0) => {
  if (seconds >= 3600) {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

const AdminGamesAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminGamesAnalytics();
        setData(res.data);
      } catch (err) {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => data?.platform_totals || {}, [data]);
  const gameStats = useMemo(() => data?.game_stats || [], [data]);
  const topStudents = useMemo(() => data?.top_students || [], [data]);
  const badgeDist = useMemo(() => data?.badge_distribution || [], [data]);
  const dailySessions = useMemo(() => data?.daily_sessions || [], [data]);
  const maxDaily = useMemo(() => Math.max(...dailySessions.map((d) => d.count), 1), [dailySessions]);

  const openUrl = async (url) => {
    const absoluteUrl = toAbsoluteUrl(url);
    if (!absoluteUrl) return;

    const supported = await Linking.canOpenURL(absoluteUrl);
    if (!supported) {
      Alert.alert('Error', 'Unable to open export URL.');
      return;
    }
    await Linking.openURL(absoluteUrl);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading analytics…</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Unable to load analytics data.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>📊 Games Analytics</Text>
            <Text style={styles.subtitle}>Platform-wide game performance, engagement & badge insights</Text>
          </View>
          <View style={styles.exportGroup}>
            <TouchableOpacity style={styles.exportBtn} onPress={() => openUrl(exportAdminGameStatsCSV())}>
              <Text style={styles.exportText}>Game Stats CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportBtn, styles.exportBtnSecondary]} onPress={() => openUrl(exportAdminTopStudentsCSV())}>
              <Text style={styles.exportText}>Top Students CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.totalsRow}>
          <TotalCard icon="👥" value={totals.total_players || 0} label="Total Players" />
          <TotalCard icon="🎮" value={totals.total_sessions || 0} label="Total Sessions" />
          <TotalCard icon="💰" value={totals.total_coins_issued || 0} label="Coins Issued" />
          <TotalCard icon="🏅" value={data.total_badges_awarded || 0} label="Badges Awarded" />
        </View>

        <Text style={styles.sectionTitle}>🎯 Per-Game Breakdown</Text>
        {gameStats.map((g) => {
          const gc = GAME_COLORS[g.game_type] || { bg: '#f3f4f6', fg: '#6b7280' };
          return (
            <View key={g.game_type} style={styles.gameCard}>
              <View style={styles.gameTitleRow}>
                <View style={[styles.gameIconWrap, { backgroundColor: gc.bg }]}>
                  <Text style={[styles.gameIcon, { color: gc.fg }]}>{GAME_ICONS[g.game_type] || '🎮'}</Text>
                </View>
                <Text style={styles.gameTitle}>{g.title}</Text>
              </View>
              <View style={styles.statsGrid}>
                <MiniStat label="Players" value={g.players} color="#4285f4" />
                <MiniStat label="Sessions" value={`${g.sessions} (${g.completed_sessions} done)`} />
                <MiniStat label="Avg Score" value={g.avg_score} color="#22c55e" />
                <MiniStat label="Avg Accuracy" value={`${Math.round(g.avg_accuracy_percent)}%`} color={gc.fg} />
                <MiniStat label="Coins" value={`💰 ${g.coins_issued}`} color="#f59e0b" />
                <MiniStat label="Total Time" value={formatTime(g.total_time_seconds)} />
              </View>
            </View>
          );
        })}

        {dailySessions.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>📈 Daily Sessions (Last 30 Days)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chartBars}>
                {dailySessions.map((d) => (
                  <View style={styles.barCol} key={d.day}>
                    <View style={styles.barValueWrap}>
                      <Text style={styles.barValue}>{d.count}</Text>
                    </View>
                    <View style={[styles.bar, { height: `${Math.max((d.count / maxDaily) * 100, 2)}%` }]} />
                    <Text style={styles.barLabel}>
                      {new Date(`${d.day}T00:00:00`).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>🏆 Top Students</Text>
        <View style={styles.panel}>
          {topStudents.length === 0 ? (
            <Text style={styles.emptyText}>No student data yet</Text>
          ) : (
            topStudents.map((s, i) => (
              <View key={s.student_id} style={styles.rowItem}>
                <View style={[styles.rank, rankStyle(i)]}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{s.student__fullname}</Text>
                  <Text style={styles.rowMeta}>Attempts: {s.total_attempts || 0}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowCoins}>💰 {s.total_coins || 0}</Text>
                  <Text style={styles.rowScore}>{s.total_score || 0}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>🏅 Badge Distribution</Text>
        <View style={styles.panel}>
          {badgeDist.length === 0 ? (
            <Text style={styles.emptyText}>No badges have been awarded yet</Text>
          ) : (
            badgeDist.map((b) => (
              <View key={b.badge__badge_key} style={styles.rowItem}>
                <View style={styles.badgeIconWrap}>
                  <Text style={styles.badgeIcon}>{BADGE_ICONS[b.badge__badge_key] || '🏅'}</Text>
                </View>
                <Text style={[styles.rowName, { flex: 1 }]}>{b.badge__title}</Text>
                <Text style={styles.badgeCount}>{b.count}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const TotalCard = ({ icon, value, label }) => (
  <View style={styles.totalCard}>
    <Text style={styles.totalIcon}>{icon}</Text>
    <View>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  </View>
);

const MiniStat = ({ label, value, color = '#1a1a2e' }) => (
  <View style={styles.miniStat}>
    <Text style={styles.miniLabel}>{label}</Text>
    <Text style={[styles.miniValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  content: { padding: 14, paddingBottom: 28 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6b7280', fontSize: 14 },

  header: { marginBottom: 18, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#6b7280' },
  exportGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exportBtn: {
    backgroundColor: '#4285f4',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  exportBtnSecondary: { backgroundColor: '#8b5cf6' },
  exportText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  totalsRow: { gap: 10, marginBottom: 18 },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalIcon: { fontSize: 22 },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', lineHeight: 26 },
  totalLabel: { marginTop: 2, fontSize: 11, color: '#6b7280', textTransform: 'uppercase' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },

  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 10,
  },
  gameTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  gameIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIcon: { fontSize: 15 },
  gameTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniStat: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
  },
  miniLabel: { fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' },
  miniValue: { marginTop: 2, fontSize: 13, fontWeight: '700' },

  chartContainer: { marginBottom: 16 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 160, paddingTop: 10 },
  barCol: { width: 24, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValueWrap: { height: 16, justifyContent: 'center' },
  barValue: { fontSize: 9, color: '#4285f4', fontWeight: '700' },
  bar: {
    width: 20,
    borderRadius: 4,
    backgroundColor: '#4285f4',
    minHeight: 2,
  },
  barLabel: { marginTop: 6, fontSize: 8, color: '#9ca3af', transform: [{ rotate: '-45deg' }] },

  panel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 11, fontWeight: '700' },
  rankGold: { backgroundColor: '#fef3c7' },
  rankSilver: { backgroundColor: '#f3f4f6' },
  rankBronze: { backgroundColor: '#fde68a' },
  rankNormal: { backgroundColor: '#f3f4f6' },
  rowName: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  rowMeta: { marginTop: 2, fontSize: 11, color: '#6b7280' },
  rowRight: { alignItems: 'flex-end' },
  rowCoins: { fontSize: 12, color: '#374151' },
  rowScore: { marginTop: 1, fontSize: 15, fontWeight: '700', color: '#1a1a2e' },

  badgeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  badgeIcon: { fontSize: 15 },
  badgeCount: { fontSize: 20, fontWeight: '800', color: '#4285f4' },

  emptyText: { textAlign: 'center', color: '#9ca3af', paddingVertical: 20, fontSize: 13 },
});

export default AdminGamesAnalytics;
