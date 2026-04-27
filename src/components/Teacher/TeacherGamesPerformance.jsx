import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  getTeacherStudentsGamePerformance,
  exportTeacherGamePerformanceCSV,
} from '../../services/gameService';

const accuracyColor = (v) => (v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#ef4444');
const initials = (name) =>
  (name || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const SORT_FIELDS = [
  { key: 'student_name', label: 'Student' },
  { key: 'game_title', label: 'Game' },
  { key: 'total_attempts', label: 'Attempts' },
  { key: 'accuracy_percent', label: 'Accuracy' },
  { key: 'best_score', label: 'Best Score' },
  { key: 'best_streak', label: 'Streak' },
  { key: 'highest_level_unlocked', label: 'Level' },
  { key: 'sonara_coins', label: 'Coins' },
];

const TeacherGamesPerformance = () => {
  const [teacherId, setTeacherId] = useState(null)

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('student_name');
  const [sortDir, setSortDir] = useState('asc');
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId')
        setTeacherId(id)
      } catch (e) {
        console.log(e)
      }
    }

    getTeacherId()
  }, [])

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await getTeacherStudentsGamePerformance(teacherId, {
        game_type: gameFilter,
        search,
        sort: sortBy,
        dir: sortDir,
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load game performance', err);
    }
    setLoading(false);
  }, [teacherId, gameFilter, search, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = useMemo(() => data?.flat_rows || [], [data]);
  const grouped = useMemo(() => data?.results || [], [data]);
  const games = useMemo(() => data?.available_games || [], [data]);

  const summaryStats = useMemo(() => {
    if (!rows.length) return null;
    const totalAttempts = rows.reduce((s, r) => s + r.total_attempts, 0);
    const totalCoins = rows.reduce((s, r) => s + r.sonara_coins, 0);
    const avgAccuracy =
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.accuracy_percent, 0) / rows.length)
        : 0;
    const bestScore = Math.max(...rows.map((r) => r.best_score), 0);
    return {
      totalStudents: data?.total_students || 0,
      totalAttempts,
      avgAccuracy,
      totalCoins,
      bestScore,
    };
  }, [rows, data]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'student_name' || key === 'game_title' ? 'asc' : 'desc');
    }
  };

  const sortArrow = (key) => {
    if (sortBy !== key) return '↕';
    return sortDir === 'asc' ? '▲' : '▼';
  };

  const handleExport = async () => {
    try {
      const url = exportTeacherGamePerformanceCSV(teacherId, {
        game_type: gameFilter,
        search,
        sort: sortBy,
        dir: sortDir,
      });
      await Linking.openURL(url)
    } catch (e) {
      Alert.alert('Error', 'Failed to open CSV export')
    }
  };

  if (loading) {
    return (
      <View style={styles.tgpContainer}>
        <View style={styles.tgpLoading}>
          <ActivityIndicator color='#22c55e' size='large' />
          <Text style={styles.loadingText}>Loading game performance…</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tgpContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.tgpHeader}>
        <View>
          <Text style={styles.headerTitle}>🎮 Student <Text style={styles.headerTitleAccent}>Game Performance</Text></Text>
          <Text style={styles.headerSubtitle}>Monitor your students' progress across all Sonara games</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportBtnText}>⬇ Export CSV</Text>
        </TouchableOpacity>
      </View>

      {summaryStats && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}><Text style={{ color: '#22c55e' }}>👥</Text></View>
            <Text style={styles.summaryValue}>{summaryStats.totalStudents}</Text>
            <Text style={styles.summaryLabel}>Students</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}><Text style={{ color: '#6366f1' }}>🎯</Text></View>
            <Text style={styles.summaryValue}>{summaryStats.totalAttempts}</Text>
            <Text style={styles.summaryLabel}>Total Attempts</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}><Text style={{ color: '#f59e0b' }}>📊</Text></View>
            <Text style={styles.summaryValue}>{summaryStats.avgAccuracy}%</Text>
            <Text style={styles.summaryLabel}>Avg Accuracy</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(236,72,153,0.12)' }]}><Text style={{ color: '#ec4899' }}>🏆</Text></View>
            <Text style={styles.summaryValue}>{summaryStats.bestScore}</Text>
            <Text style={styles.summaryLabel}>Top Score</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(234,179,8,0.12)' }]}><Text style={{ color: '#eab308' }}>💰</Text></View>
            <Text style={styles.summaryValue}>{summaryStats.totalCoins}</Text>
            <Text style={styles.summaryLabel}>Coins Earned</Text>
          </View>
        </View>
      )}

      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            placeholder='Search students…'
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.gameFilterWrap}>
          <Picker selectedValue={gameFilter} onValueChange={(value) => setGameFilter(value)}>
            <Picker.Item label='All Games' value='' />
            {games.map((g) => (
              <Picker.Item key={g.game_type} label={g.title} value={g.game_type} />
            ))}
          </Picker>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity style={[styles.viewBtn, viewMode === 'table' ? styles.viewBtnActive : null]} onPress={() => setViewMode('table')}>
            <Text style={viewMode === 'table' ? styles.viewBtnTextActive : styles.viewBtnText}>Table</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.viewBtn, viewMode === 'cards' ? styles.viewBtnActive : null]} onPress={() => setViewMode('cards')}>
            <Text style={viewMode === 'cards' ? styles.viewBtnTextActive : styles.viewBtnText}>Cards</Text>
          </TouchableOpacity>
        </View>
      </View>

      {rows.length === 0 && (
        <View style={styles.tableWrap}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎵</Text>
            <Text style={styles.emptyTitle}>No game data yet</Text>
            <Text style={styles.emptyText}>Your students haven't played any Sonara games yet. Once they start playing, their stats will appear here.</Text>
          </View>
        </View>
      )}

      {rows.length > 0 && viewMode === 'table' && (
        <View style={styles.tableWrap}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableTitle}>Performance Details</Text>
            <Text style={styles.tableCount}>{rows.length} records</Text>
          </View>

          <ScrollView horizontal>
            <View style={styles.tableContainer}>
              <ScrollView>
                <View style={styles.tableHeadRow}>
                  {SORT_FIELDS.map((f) => (
                    <TouchableOpacity key={f.key} onPress={() => toggleSort(f.key)} style={styles.thCell}>
                      <Text style={styles.thText}>{f.label} <Text style={sortBy === f.key ? styles.sortArrowActive : styles.sortArrow}>{sortArrow(f.key)}</Text></Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {rows.map((r, i) => (
                  <View key={`${r.student_id}-${r.game_type}-${i}`} style={styles.trRow}>
                    <View style={styles.tdCell}><Text style={styles.studentName}>{r.student_name}</Text></View>
                    <View style={styles.tdCell}><Text style={[styles.gameBadge, styles[`game_${r.game_type}`]]}>{r.game_title}</Text></View>
                    <View style={styles.tdCell}><Text style={styles.cellText}>{r.total_attempts}</Text></View>
                    <View style={styles.tdCell}>
                      <View style={styles.accuracyBar}>
                        <View style={styles.accuracyTrack}>
                          <View style={[styles.accuracyFill, { width: `${Math.min(r.accuracy_percent, 100)}%`, backgroundColor: accuracyColor(r.accuracy_percent) }]} />
                        </View>
                        <Text style={[styles.accuracyText, { color: accuracyColor(r.accuracy_percent) }]}>{r.accuracy_percent}%</Text>
                      </View>
                    </View>
                    <View style={styles.tdCell}><Text style={styles.bestScore}>{r.best_score}</Text></View>
                    <View style={styles.tdCell}><Text style={styles.cellText}>{r.best_streak} 🔥</Text></View>
                    <View style={styles.tdCell}><Text style={styles.cellText}>{r.highest_level_unlocked}</Text></View>
                    <View style={styles.tdCell}><Text style={styles.cellText}>💰 {r.sonara_coins}</Text></View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      {rows.length > 0 && viewMode === 'cards' && (
        <View style={styles.cardsGrid}>
          {grouped.map((student) => (
            <View style={styles.studentCard} key={student.student_id}>
              <View style={styles.studentCardHeader}>
                <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{initials(student.student_name)}</Text></View>
                <View>
                  <Text style={styles.cardName}>{student.student_name}</Text>
                  <Text style={styles.cardMeta}>{student.games.length} game{student.games.length !== 1 ? 's' : ''} · 💰 {student.total_coins} coins</Text>
                </View>
              </View>
              <View style={styles.studentCardBody}>
                {student.games.map((g) => (
                  <View style={styles.miniGameRow} key={g.game_type}>
                    <Text style={[styles.gameBadge, styles[`game_${g.game_type}`]]}>{g.game_title}</Text>
                    <View style={styles.miniStatWrap}>
                      <Text style={styles.miniStat}>🎯 <Text style={styles.miniStatValue}>{g.accuracy_percent}%</Text></Text>
                      <Text style={styles.miniStat}>⭐ <Text style={styles.miniStatValue}>{g.best_score}</Text></Text>
                      <Text style={styles.miniStat}>🔥 <Text style={styles.miniStatValue}>{g.best_streak}</Text></Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tgpContainer: {
    padding: 24,
    color: '#1a1a2e',
    minHeight: '100%',
    backgroundColor: '#f8f9fc',
  },
  tgpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerTitleAccent: {
    color: '#22c55e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#22c55e',
    borderRadius: 10,
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 150,
    flexGrow: 1,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchBox: {
    minWidth: 200,
    maxWidth: 340,
    position: 'relative',
    width: '100%',
  },
  searchInput: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingLeft: 38,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 11,
    color: '#9ca3af',
    zIndex: 2,
  },
  gameFilterWrap: {
    minWidth: 160,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewBtnActive: {
    backgroundColor: '#22c55e',
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewBtnTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  tableWrap: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  tableCount: {
    fontSize: 13,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tableContainer: {
    minWidth: 980,
  },
  tableHeadRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  thCell: {
    width: 122,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  thText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortArrow: {
    fontSize: 10,
    opacity: 0.4,
  },
  sortArrowActive: {
    fontSize: 10,
    color: '#22c55e',
  },
  trRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tdCell: {
    width: 122,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#374151',
  },
  studentName: {
    fontWeight: '600',
    color: '#1a1a2e',
    fontSize: 14,
  },
  gameBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  game_note_ninja: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#6366f1',
  },
  game_rhythm_rush: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    color: '#ec4899',
  },
  game_music_challenge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
  },
  accuracyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accuracyTrack: {
    width: 60,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 3,
  },
  accuracyText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 40,
  },
  bestScore: {
    fontWeight: '700',
    color: '#374151',
    fontSize: 14,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    minWidth: 320,
    flexGrow: 1,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardName: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1a1a2e',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  studentCardBody: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  miniGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  miniStatWrap: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStat: {
    fontSize: 13,
    color: '#6b7280',
  },
  miniStatValue: {
    fontWeight: '700',
    color: '#1a1a2e',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  tgpLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    color: '#6b7280',
  },
})

export default TeacherGamesPerformance;
