import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { getStudentGamesOverview, getGameLeaderboard, seedPhase1Games } from '../../services/gameService';

/* ── Game meta ──────────────────────────────────────────────── */
const GAME_META = {
  note_ninja:      { icon: '🎯', color: '#3b82f6', route: 'NoteNinjaGame' },
  rhythm_rush:     { icon: '🥁', color: '#8b5cf6', route: 'RhythmRushGame' },
  music_challenge: { icon: '⚡', color: '#f59e0b', route: 'MusicChallengeGame' },
};

/* ── Badge meta ─────────────────────────────────────────────── */
const BADGE_META = {
  note_master:      { icon: '🎵', color: '#3b82f6', desc: 'Master of note identification' },
  rhythm_king:      { icon: '👑', color: '#8b5cf6', desc: 'King of rhythm patterns' },
  theory_champion:  { icon: '🏆', color: '#f59e0b', desc: 'Champion of music theory' },
};

/* ── Tabs ───────────────────────────────────────────────────── */
const TABS = ['games', 'leaderboard', 'badges'];

const StudentGamesHub = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const [studentId, setStudentId]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [overview, setOverview]       = useState(null);
  const [activeTab, setActiveTab]     = useState('games');
  const [lbGame, setLbGame]           = useState('note_ninja');
  const [lbData, setLbData]           = useState(null);
  const [lbLoading, setLbLoading]     = useState(false);

  useEffect(() => {
    const loadStudentId = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        setStudentId(storedStudentId);
      } catch (error) {
        console.log('Failed to load student id:', error);
        setLoading(false);
      }
    };

    loadStudentId();
  }, []);

  /* ── Load overview ──────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try { await seedPhase1Games(); } catch (_) {}
    try {
      const res = await getStudentGamesOverview(studentId);
      setOverview(res.data);
    } catch (e) { console.error('Games overview failed', e); }
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  /* ── Load leaderboard when tab or game changes ──────────── */
  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    let cancelled = false;
    const fetchLb = async () => {
      setLbLoading(true);
      try {
        const res = await getGameLeaderboard(lbGame);
        if (!cancelled) setLbData(res.data);
      } catch (_) { if (!cancelled) setLbData(null); }
      if (!cancelled) setLbLoading(false);
    };
    fetchLb();
    return () => { cancelled = true; };
  }, [activeTab, lbGame]);

  /* ── Derived data ───────────────────────────────────────── */
  const coins  = overview?.sonara_coins_total || 0;
  const games  = overview?.games || [];
  const badges = overview?.badges || [];
  const recent = overview?.recent_sessions || [];

  /* ── Time-ago helper ────────────────────────────────────── */
  const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  if (loading) {
    return (
          <View style={styles.centerLoadingWrap}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading games...</Text>
            </View>
          </View>
    );
  }

  return (

        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          <View style={[styles.headerCard, isCompact && styles.headerCardCompact]}>
            <View>
              <Text style={[styles.title, isCompact && styles.titleCompact]}>🎮 Games Hub</Text>
              <Text style={styles.subtitle}>Play, learn, and earn rewards</Text>
            </View>
            <View style={[styles.coinsCard, isCompact && styles.coinsCardCompact]}>
              <Text style={styles.coinsIcon}>💰</Text>
              <View>
                <Text style={styles.coinsAmount}>{coins.toLocaleString()}</Text>
                <Text style={styles.coinsLabel}>Kannari Coins</Text>
              </View>
            </View>
          </View>

          <View style={[styles.tabsWrap, isCompact && styles.tabsWrapCompact]}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isCompact && styles.tabBtnCompact, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isCompact && styles.tabTextCompact, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'games' ? '🎮 Games' : tab === 'leaderboard' ? '🏅 Leaderboard' : '🏆 Badges'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ════════════════════════════════════════════════════
              GAMES TAB
              ════════════════════════════════════════════════════ */}
          {activeTab === 'games' && (
            <>
              {/* Game Cards */}
              <View style={styles.gamesGrid}>
                {games.map(g => {
                  const meta = GAME_META[g.game.game_type] || {};
                  const prof = g.profile || {};
                  const lvl  = prof.highest_level_unlocked || 1;
                  const maxLvl = g.game.max_level || 20;
                  const pct  = (lvl / maxLvl) * 100;
                  return (
                    <View key={g.game.id} style={[styles.gameCard, isCompact && styles.gameCardCompact]}>
                      <View style={[styles.gameIconWrap, { backgroundColor: meta.color || '#3b82f6' }]}> 
                        <Text style={styles.gameIcon}>{meta.icon || '🎮'}</Text>
                      </View>

                      <Text style={styles.gameTitle}>{g.game.title}</Text>
                      <Text style={styles.gameDesc}>{g.game.description}</Text>

                      <View style={styles.statsGrid}>
                        <View style={styles.statItem}><Text style={styles.statVal}>{prof.best_score || 0}</Text><Text style={styles.statLbl}>Best</Text></View>
                        <View style={styles.statItem}><Text style={styles.statVal}>{prof.accuracy_percent?.toFixed(0) || 0}%</Text><Text style={styles.statLbl}>Accuracy</Text></View>
                        <View style={styles.statItem}><Text style={styles.statVal}>{prof.best_streak || 0}</Text><Text style={styles.statLbl}>Streak</Text></View>
                        <View style={styles.statItem}><Text style={styles.statVal}>{prof.sonara_coins || 0}</Text><Text style={styles.statLbl}>Coins</Text></View>
                      </View>

                      <View style={styles.levelRow}>
                        <Text style={styles.levelLabel}>Level {lvl}/{maxLvl}</Text>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: meta.color || '#3b82f6' }]} />
                        </View>
                      </View>

                        {g.access.allowed ? (
                          <TouchableOpacity style={[styles.playBtn, { backgroundColor: meta.color || '#3b82f6' }]} onPress={() => navigation.navigate(meta.route)}>
                            <Text style={styles.playBtnText}>▶ Play Now</Text>
                          </TouchableOpacity>
                        ) : !g.access.has_subscription ? (
                          <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#f59e0b' }]} onPress={() => navigation.navigate('StudentSubscriptions')}>
                            <Text style={styles.playBtnText}>🔒 Subscribe to Play</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.lockedBadge}><Text style={styles.lockedText}>👑 Requires {g.access.required_access_level}</Text></View>
                        )}
                    </View>
                  );
                })}
              </View>

              {/* Recently Played */}
              {recent.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>🕐 Recently Played</Text>
                  <View style={styles.recentList}>
                    {recent.map(s => {
                      const meta = GAME_META[s.game_type] || {};
                      return (
                        <View key={s.id} style={styles.recentItem}>
                          <View style={[styles.recentIconWrap, { backgroundColor: meta.color || '#3b82f6' }]}>
                            <Text style={styles.recentIcon}>{meta.icon || '🎮'}</Text>
                          </View>
                          <View style={styles.recentBody}>
                            <Text style={styles.recentTitle}>{s.game_title}</Text>
                            <Text style={styles.recentMeta}>
                              Lv.{s.level} · Score {s.score} · {s.correct_count}/{s.correct_count + s.wrong_count} correct
                            </Text>
                          </View>
                          <Text style={styles.recentTime}>{timeAgo(s.completed_at)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════
              LEADERBOARD TAB
              ════════════════════════════════════════════════════ */}
          {activeTab === 'leaderboard' && (
            <View style={styles.lbSection}>
              {/* Game selector */}
              <View style={styles.lbSelector}>
                {games.map(g => {
                  const meta = GAME_META[g.game.game_type] || {};
                  return (
                    <TouchableOpacity
                      key={g.game.game_type}
                      style={[
                        styles.lbGameBtn,
                        lbGame === g.game.game_type && { borderColor: meta.color || '#3b82f6', backgroundColor: '#f8fafc' },
                      ]}
                      onClick={() => setLbGame(g.game.game_type)}
                      onPress={() => setLbGame(g.game.game_type)}
                    >
                      <Text style={[styles.lbGameBtnText, lbGame === g.game.game_type && { color: meta.color || '#3b82f6' }]}>
                        {meta.icon} {g.game.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {lbData && (
                <Text style={styles.lbWeek}>
                  Week of {new Date(lbData.week_start).toLocaleDateString()} – {new Date(lbData.week_end).toLocaleDateString()}
                </Text>
              )}

              {lbLoading && <Text style={styles.loadingInline}>Loading leaderboard...</Text>}

              {!lbLoading && lbData && (
                <View style={styles.lbWrap}>
                  {(lbData.results || []).length === 0 ? (
                    <Text style={styles.lbEmpty}>No rankings this week yet. Play a game to get on the board!</Text>
                  ) : (
                    <View style={styles.lbList}>
                      {(lbData.results || []).map((r) => {
                        const isMe = r.student === parseInt(studentId, 10);
                        const rankLabel = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}`;

                        return (
                          <View key={r.id} style={[styles.lbRow, isMe && styles.lbRowMe]}>
                            <Text style={styles.lbRank}>{rankLabel}</Text>
                            <View style={styles.lbPlayerCol}>
                              <Text style={styles.lbPlayerName}>{r.student_name}{isMe ? ' (YOU)' : ''}</Text>
                              <Text style={styles.lbPlayerMeta}>Accuracy {r.avg_accuracy?.toFixed(0) || 0}% · Streak {r.best_streak}</Text>
                            </View>
                            <Text style={styles.lbScore}>{r.total_score.toLocaleString()}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ════════════════════════════════════════════════════
              BADGES TAB
              ════════════════════════════════════════════════════ */}
          {activeTab === 'badges' && (
            <View style={styles.badgesSection}>
              <Text style={styles.badgesIntro}>
                Earn badges by reaching high accuracy, advancing levels, and building streaks!
              </Text>
              <View style={styles.badgesGrid}>
                {badges.map(b => {
                  const meta = BADGE_META[b.badge_key] || { icon: '🏅', color: '#6366f1', desc: '' };
                  return (
                    <View key={b.badge_key} style={[styles.badgeCard, b.earned ? styles.badgeEarned : styles.badgeLocked]}>
                      <View style={[styles.badgeIconWrap, b.earned && { borderColor: meta.color }]}>
                        <Text style={styles.badgeIcon}>{b.earned ? meta.icon : '🔒'}</Text>
                      </View>
                      <Text style={styles.badgeTitle}>{b.title}</Text>
                      <Text style={styles.badgeDesc}>{b.description || meta.desc}</Text>

                      <View style={styles.badgeCriteria}>
                        {b.criteria?.min_accuracy && (
                          <Text style={styles.badgeCritItem}>🎯 {b.criteria.min_accuracy}% accuracy</Text>
                        )}
                        {b.criteria?.min_level && (
                          <Text style={styles.badgeCritItem}>📊 Level {b.criteria.min_level}+</Text>
                        )}
                        {b.criteria?.min_streak && (
                          <Text style={styles.badgeCritItem}>🔥 {b.criteria.min_streak}+ streak</Text>
                        )}
                      </View>

                      {b.earned ? (
                        <Text style={styles.badgeEarnedInfo}>
                          ✅ Earned {timeAgo(b.awarded_at)}
                        </Text>
                      ) : (
                        <Text style={styles.badgeLockedInfo}>
                          Keep playing to unlock!
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  contentWrap: {
    flex: 1,
  },
  sidebarOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 999,
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
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    marginRight: 10,
  },
  sidebarToggleText: {
    color: '#1d4ed8',
    fontSize: 20,
    fontWeight: '700',
  },
  logoMini: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  centerLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingCard: {
    minWidth: 180,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  headerCardCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  coinsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coinsCardCompact: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  coinsIcon: {
    fontSize: 22,
  },
  coinsAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9a3412',
  },
  coinsLabel: {
    fontSize: 11,
    color: '#7c2d12',
  },
  tabsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  tabsWrapCompact: {
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  tabBtnCompact: {
    paddingVertical: 9,
  },
  tabBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextCompact: {
    fontSize: 12,
  },
  tabTextActive: {
    color: '#1d4ed8',
  },
  gamesGrid: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  gameCardCompact: {
    padding: 12,
  },
  gameIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gameIcon: {
    fontSize: 22,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  gameDesc: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  statsGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    minWidth: 70,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statVal: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  statLbl: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  levelRow: {
    marginTop: 10,
  },
  levelLabel: {
    color: '#334155',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  playBtn: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  playBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  lockedBadge: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  lockedText: {
    color: '#9a3412',
    fontWeight: '600',
    fontSize: 13,
  },
  recentSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  sectionTitleCompact: {
    fontSize: 16,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: {
    fontSize: 18,
  },
  recentBody: {
    flex: 1,
  },
  recentTitle: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 13,
  },
  recentMeta: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
  },
  recentTime: {
    color: '#94a3b8',
    fontSize: 11,
  },
  lbSection: {
    gap: 10,
  },
  lbSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lbGameBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  lbGameBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  lbWeek: {
    color: '#64748b',
    fontSize: 13,
  },
  loadingInline: {
    color: '#64748b',
    fontSize: 13,
  },
  lbWrap: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
  },
  lbEmpty: {
    color: '#64748b',
    fontSize: 13,
  },
  lbList: {
    gap: 8,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lbRowMe: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  lbRank: {
    width: 30,
    textAlign: 'center',
    fontWeight: '700',
    color: '#0f172a',
  },
  lbPlayerCol: {
    flex: 1,
  },
  lbPlayerName: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 13,
  },
  lbPlayerMeta: {
    marginTop: 1,
    color: '#64748b',
    fontSize: 11,
  },
  lbScore: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  badgesSection: {
    gap: 10,
  },
  badgesIntro: {
    color: '#64748b',
    fontSize: 13,
  },
  badgesGrid: {
    gap: 10,
  },
  badgeCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  badgeEarned: {
    backgroundColor: '#ecfeff',
    borderColor: '#a5f3fc',
  },
  badgeLocked: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  badgeIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeTitle: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  badgeDesc: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  badgeCriteria: {
    marginTop: 8,
    gap: 4,
  },
  badgeCritItem: {
    color: '#334155',
    fontSize: 12,
  },
  badgeEarnedInfo: {
    marginTop: 8,
    color: '#166534',
    fontWeight: '600',
    fontSize: 12,
  },
  badgeLockedInfo: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 12,
  },
});

export default StudentGamesHub;
