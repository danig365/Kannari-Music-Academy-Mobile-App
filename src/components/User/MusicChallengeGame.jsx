import React, { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import {
  startGameSession,
  submitGameAttempt,
  finishGameSession,
  getStudentGamesOverview,
} from '../../services/gameService';

const SOUND_ASSETS = {
  click200: require('../../../assets/sounds/rhythm/click_200.wav'),
  click440: require('../../../assets/sounds/rhythm/click_440.wav'),
  click523: require('../../../assets/sounds/rhythm/click_523.wav'),
  click659: require('../../../assets/sounds/rhythm/click_659.wav'),
  click784: require('../../../assets/sounds/rhythm/click_784.wav'),
  click880: require('../../../assets/sounds/rhythm/click_880.wav'),
  click660: require('../../../assets/sounds/rhythm/click_659.wav'),
  click392: require('../../../assets/sounds/rhythm/click_440.wav'),
};

const CAT_META = {
  instruments: { icon: '🎸', label: 'Instruments', color: '#f59e0b' },
  symbols: { icon: '🎵', label: 'Symbols', color: '#8b5cf6' },
  rhythm: { icon: '🥁', label: 'Rhythm', color: '#ef4444' },
  theory: { icon: '📖', label: 'Theory', color: '#3b82f6' },
  composers: { icon: '🎹', label: 'Composers', color: '#10b981' },
};

const catInfo = (category) => CAT_META[category] || { icon: '⚡', label: category || 'General', color: '#6366f1' };
const getPayload = (response) => response?.data ?? response ?? {};

const PHASE = {
  MENU: 'MENU',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  FEEDBACK: 'FEEDBACK',
  SUMMARY: 'SUMMARY',
};

const GAME_LEVEL_CAP = 20;

const MusicChallengeGame = () => {
  const navigation = useNavigation();

  const [studentId, setStudentId] = useState(null);
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const [phase, setPhase] = useState(PHASE.MENU);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [startError, setStartError] = useState('');

  const [timeLeft, setTimeLeft] = useState(8);
  const timerRef = useRef(null);
  const questionStartRef = useRef(null);

  const [fbResult, setFbResult] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [attempts, setAttempts] = useState([]);

  const [countNum, setCountNum] = useState(3);

  const [finalSession, setFinalSession] = useState(null);
  const [networkError, setNetworkError] = useState('');
  const clearNetworkError = () => setNetworkError('');

  const soundRefs = useRef([]);

  const playAsset = useCallback(async (asset) => {
    try {
      const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true, volume: 1 });
      soundRefs.current.push(sound);
      if (soundRefs.current.length > 10) {
        const stale = soundRefs.current.shift();
        stale?.unloadAsync().catch(() => {});
      }
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          soundRefs.current = soundRefs.current.filter((s) => s !== sound);
        }
      });
    } catch (_) {}
  }, []);

  const playCorrect = useCallback(() => {
    setTimeout(() => playAsset(SOUND_ASSETS.click523), 0);
    setTimeout(() => playAsset(SOUND_ASSETS.click659), 80);
    setTimeout(() => playAsset(SOUND_ASSETS.click784), 160);
  }, [playAsset]);

  const playWrong = useCallback(() => {
    playAsset(SOUND_ASSETS.click200);
  }, [playAsset]);

  const playTick = useCallback(() => {
    playAsset(SOUND_ASSETS.click880);
  }, [playAsset]);

  const playFinish = useCallback(() => {
    setTimeout(() => playAsset(SOUND_ASSETS.click392), 0);
    setTimeout(() => playAsset(SOUND_ASSETS.click523), 120);
    setTimeout(() => playAsset(SOUND_ASSETS.click784), 240);
  }, [playAsset]);

  const playCountdown = useCallback(() => {
    playAsset(SOUND_ASSETS.click660);
  }, [playAsset]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch(() => {});

    const loadStudentId = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        setStudentId(storedStudentId);
      } catch (_) {
        setLoading(false);
      }
    };

    loadStudentId();
  }, []);

  const loadOverview = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getStudentGamesOverview(studentId);
      const data = getPayload(res);
      setOverview(data);

      const games = data.games || [];
      let mc = null;
      if (Array.isArray(games)) {
        mc = games.find((g) => g.game?.game_type === 'music_challenge');
      } else {
        mc = games.music_challenge || Object.values(games).find((g) => g.game?.game_type === 'music_challenge');
      }

      setGameData(mc || null);
      if (mc?.profile) {
        setSelectedLevel(Math.min(mc.profile.highest_level_unlocked || 1, mc.game?.max_level || GAME_LEVEL_CAP));
      }
    } catch (_) {}

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    const limit = question?.time_limit_seconds || 8;
    setTimeLeft(limit);
    const t0 = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const rem = Math.max(0, limit - elapsed);
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 50);
  }, [question, stopTimer]);

  useEffect(() => () => {
    stopTimer();
    soundRefs.current.forEach((sound) => sound.unloadAsync().catch(() => {}));
    soundRefs.current = [];
  }, [stopTimer]);

  const startGame = async () => {
    if (!studentId) return;

    setStartError('');
    try {
      const res = await startGameSession(studentId, 'music_challenge', selectedLevel);
      const data = getPayload(res);

      setSession(data.session);
      setQuestions(data.questions || (data.question ? [data.question] : []));
      setQIndex(0);
      setQuestion(data.question || data.questions?.[0] || null);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setAttempts([]);
      setFinalSession(null);
      setPhase(PHASE.COUNTDOWN);
      setCountNum(3);
    } catch (error) {
      setStartError(error.response?.data?.message || 'Could not start game. Check your connection.');
    }
  };

  useEffect(() => {
    if (phase !== PHASE.COUNTDOWN) return;

    if (countNum <= 0) {
      setPhase(PHASE.PLAYING);
      questionStartRef.current = Date.now();
      return;
    }

    playCountdown();
    const timeoutId = setTimeout(() => setCountNum((value) => value - 1), 800);
    return () => clearTimeout(timeoutId);
  }, [phase, countNum, playCountdown]);

  useEffect(() => {
    if (phase === PHASE.PLAYING && question) {
      questionStartRef.current = Date.now();
      startTimer();
    }
  }, [phase, question, startTimer]);

  const handleAnswer = useCallback(async (choice) => {
    if (phase !== PHASE.PLAYING || !question || !session?.id) return;

    stopTimer();
    setSelectedChoice(choice);

    const responseTimeMs = Date.now() - (questionStartRef.current || Date.now());

    try {
      const res = await submitGameAttempt(session.id, {
        question_id: question.id,
        answer: choice || '__TIMEOUT__',
        response_time_ms: responseTimeMs,
      });

      const data = getPayload(res);
      const result = data.attempt_result || { is_correct: false, points: 0, feedback: 'error' };
      const sess = data.session || {};

      let speedBonus = 0;
      if (result.is_correct) {
        if (responseTimeMs <= 2000) speedBonus = 5;
        else if (responseTimeMs <= 3500) speedBonus = 3;
      }

      const attemptData = {
        question: question.prompt,
        category: question.question_payload?.category || 'general',
        choice,
        is_correct: result.is_correct,
        points: result.points || 0,
        speedBonus,
        responseTimeMs,
        timedOut: !choice,
      };

      setFbResult({ ...result, speedBonus, responseTimeMs });
      setScore(sess.score ?? score);
      setStreak(sess.streak ?? streak);
      setMaxStreak((prev) => Math.max(prev, sess.max_streak || sess.streak || prev));
      setAttempts((prev) => [...prev, attemptData]);
      setPhase(PHASE.FEEDBACK);

      if (result.is_correct) playCorrect();
      else playWrong();
    } catch (error) {
      console.error('Submit error', error);
      const isNetworkError = !error.response;
      if (isNetworkError) {
        setNetworkError('Network error — your answer may not have been recorded.');
        setTimeout(() => clearNetworkError(), 4000);
      }
      setFbResult({ is_correct: false, feedback: 'error', points: 0, speedBonus: 0, responseTimeMs });
      setPhase(PHASE.FEEDBACK);
    }
  }, [phase, question, session, stopTimer, score, streak, playCorrect, playWrong]);

  useEffect(() => {
    if (phase === PHASE.PLAYING && timeLeft <= 0) {
      handleAnswer(null);
    }
  }, [timeLeft, phase, handleAnswer]);

  const finishSession = useCallback(async () => {
    if (!session?.id) {
      setPhase(PHASE.SUMMARY);
      return;
    }

    try {
      const elapsed = Math.round((Date.now() - (session?.started_at ? new Date(session.started_at).getTime() : Date.now())) / 1000);
      const res = await finishGameSession(session.id, { time_spent_seconds: Math.max(1, elapsed) });
      const data = getPayload(res);
      setFinalSession(data.session || data);
      playFinish();
    } catch (error) {
      console.error('Finish error', error);
      setFinalSession({ score, max_streak: maxStreak });
    }

    setPhase(PHASE.SUMMARY);
  }, [session, score, maxStreak, playFinish]);

  useEffect(() => {
    if (phase !== PHASE.FEEDBACK) return;

    const timeoutId = setTimeout(() => {
      const nextIndex = qIndex + 1;
      if (nextIndex < questions.length) {
        setQIndex(nextIndex);
        setQuestion(questions[nextIndex]);
        setFbResult(null);
        setSelectedChoice(null);
        setPhase(PHASE.PLAYING);
      } else {
        finishSession();
      }
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [phase, qIndex, questions, finishSession]);

  useEffect(() => {
    if (phase !== PHASE.PLAYING) return;
    setSelectedChoice(null);
  }, [phase, qIndex, question?.id]);

  const backToMenu = () => {
    setPhase(PHASE.MENU);
    setSession(null);
    setQuestion(null);
    setQuestions([]);
    setQIndex(0);
    setFbResult(null);
    setSelectedChoice(null);
    loadOverview();
  };

  const profile = gameData?.profile;
  const access = gameData?.access;
  const maxLevel = Math.min(gameData?.game?.max_level || GAME_LEVEL_CAP, GAME_LEVEL_CAP);
  const highestUnlocked = profile?.highest_level_unlocked || 1;
  const maxAccessible = access?.max_accessible_level || 5;
  const hasSubscription = access?.has_subscription !== false;

  const timerPercent = ((question?.time_limit_seconds || 8) > 0)
    ? (timeLeft / (question?.time_limit_seconds || 8)) * 100
    : 0;

  const cat = catInfo(question?.question_payload?.category);

  if (loading) {
    return (
          <View style={styles.centerLoadingWrap}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#f59e0b" />
              <Text style={styles.loadingText}>Loading Music Challenge...</Text>
            </View>
          </View>
    );
  }

  return (
    <View style={styles.pageWrap}>
      <View style={styles.contentWrap}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('StudentGamesHub')}>
            <Text style={styles.backBtnText}>← Games Hub</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚡ 5-Second Music Challenge</Text>

          {phase !== PHASE.MENU && phase !== PHASE.SUMMARY ? (
            <View style={styles.scorePill}>
              <Text style={styles.scorePillText}>💰 {score}</Text>
              {streak >= 2 ? <Text style={styles.streakPill}>x{streak} 🔥</Text> : null}
            </View>
          ) : <View style={styles.scorePillPlaceholder} />}
        </View>

        {networkError ? (
          <View style={styles.networkError}>
            <Text style={styles.networkErrorText}>⚠️ {networkError}</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={clearNetworkError}>
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {phase === PHASE.MENU ? (
          <ScrollView contentContainerStyle={styles.menuScroll}>
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Your Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}><Text style={styles.statVal}>{profile?.total_score || 0}</Text><Text style={styles.statLbl}>Total Score</Text></View>
                <View style={styles.statItem}><Text style={styles.statVal}>{profile?.accuracy_percent?.toFixed?.(0) || 0}%</Text><Text style={styles.statLbl}>Accuracy</Text></View>
                <View style={styles.statItem}><Text style={styles.statVal}>{profile?.best_streak || 0}</Text><Text style={styles.statLbl}>Best Streak</Text></View>
                <View style={styles.statItem}><Text style={styles.statVal}>{profile?.sonara_coins || 0}</Text><Text style={styles.statLbl}>Kannari Coins</Text></View>
              </View>
            </View>

            {!hasSubscription ? (
              <View style={styles.subscribePrompt}>
                <Text style={styles.subscribeIcon}>🔒</Text>
                <Text style={styles.subscribeTitle}>Subscription Required</Text>
                <Text style={styles.subscribeText}>Subscribe to unlock Sonara Games and start earning coins!</Text>
                <TouchableOpacity style={styles.subscribeBtn} onPress={() => navigation.navigate('StudentSubscriptions')}>
                  <Text style={styles.subscribeBtnText}>⚡ Subscribe to Play</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.levelCard}>
                  <Text style={styles.cardTitle}>Select Level</Text>
                  <View style={styles.levelGrid}>
                    {Array.from({ length: maxLevel }, (_, i) => i + 1).map((lvl) => {
                      const unlocked = lvl <= highestUnlocked;
                      const accessible = lvl <= maxAccessible;
                      const locked = !unlocked;
                      const gated = unlocked && !accessible;

                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={[
                            styles.levelBtn,
                            selectedLevel === lvl && styles.levelBtnSelected,
                            locked && styles.levelBtnLocked,
                            gated && styles.levelBtnGated,
                          ]}
                          onPress={() => {
                            if (unlocked && accessible) setSelectedLevel(lvl);
                          }}
                          disabled={locked || gated}
                        >
                          <Text style={styles.levelBtnText}>{locked ? '🔒' : gated ? '👑' : lvl}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.levelHint}>
                    Level {selectedLevel} — {selectedLevel <= 2 ? 'Identification' : selectedLevel <= 5 ? 'Mixed Knowledge' : 'Advanced Theory'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                  <Text style={styles.startBtnText}>⚡ Start Challenge</Text>
                </TouchableOpacity>
                {startError ? <Text style={styles.errorText}>⚠️ {startError}</Text> : null}
              </>
            )}
          </ScrollView>
        ) : null}

        {phase === PHASE.COUNTDOWN ? (
          <View style={styles.countdownWrap}>
            <Text style={styles.countdownNum}>{countNum > 0 ? countNum : 'GO!'}</Text>
          </View>
        ) : null}

        {(phase === PHASE.PLAYING || phase === PHASE.FEEDBACK) && question ? (
          <ScrollView contentContainerStyle={styles.gameArea}>
            <View style={styles.progressRow}>
              <Text style={styles.qCounter}>Q {qIndex + 1} / {questions.length}</Text>
              <View style={styles.progressTrack}>
                {questions.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index < qIndex && styles.progressDotDone,
                      index === qIndex && styles.progressDotCurrent,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.timerWrap}>
              <View
                style={[
                  styles.timerBar,
                  { width: `${timerPercent}%` },
                  timeLeft <= 1.5 && styles.timerBarDanger,
                  timeLeft > 1.5 && timeLeft <= 3 && styles.timerBarWarning,
                ]}
              />
              <Text style={styles.timerText}>{timeLeft.toFixed(1)}s</Text>
            </View>

            {phase === PHASE.PLAYING && Math.abs(timeLeft - Math.round(timeLeft)) < 0.03 ? (
              <View style={styles.tickHint}><Text style={styles.tickHintText}>⏱</Text></View>
            ) : null}

            <View style={[styles.catBadge, { borderColor: cat.color }]}>
              <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.icon} {cat.label}</Text>
            </View>

            <View style={styles.promptCard}>
              <Text style={styles.promptText}>{question.prompt}</Text>
            </View>

            <View style={styles.choicesGrid} key={question.id}>
              {(question.choices || []).map((choice, index) => {
                let choiceStyle = null;
                if (phase === PHASE.FEEDBACK && fbResult) {
                  if (choice === selectedChoice && fbResult.is_correct) choiceStyle = styles.choiceCorrect;
                  else if (choice === selectedChoice && !fbResult.is_correct) choiceStyle = styles.choiceWrong;
                  else if (fbResult.correct_answer && choice === fbResult.correct_answer && !fbResult.is_correct) choiceStyle = styles.choiceReveal;
                }

                return (
                  <TouchableOpacity
                    key={`${question.id}-${index}`}
                    style={[styles.choiceBtn, choiceStyle]}
                    onPress={() => handleAnswer(choice)}
                    disabled={phase === PHASE.FEEDBACK}
                  >
                    <Text style={styles.choiceKey}>{index + 1}</Text>
                    <Text style={styles.choiceText}>{choice}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {phase === PHASE.FEEDBACK && fbResult ? (
              <View style={[styles.feedbackFlash, fbResult.is_correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackIcon}>{fbResult.is_correct ? '✅' : (fbResult.feedback === 'timeout' ? '⏰' : '❌')}</Text>
                  <Text style={styles.feedbackLabel}>{fbResult.is_correct ? 'Correct!' : (selectedChoice ? 'Wrong!' : "Time's Up!")}</Text>

                  {fbResult.is_correct ? (
                    <View style={styles.feedbackPointsWrap}>
                      <Text style={styles.feedbackPoints}>+{fbResult.points} pts</Text>
                      {fbResult.speedBonus > 0 ? <Text style={styles.speedBonus}>⚡+{fbResult.speedBonus} speed</Text> : null}
                      {streak >= 2 ? <Text style={styles.streakBonus}>🔥 x{streak} streak</Text> : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </ScrollView>
        ) : null}

        {phase === PHASE.SUMMARY ? (
          <ScrollView contentContainerStyle={styles.summaryWrap}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>⚡ Challenge Complete!</Text>
              <Text style={styles.summarySubtitle}>Level {finalSession?.level || selectedLevel}</Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={[styles.summaryStat, styles.summaryStatHero]}>
                <Text style={[styles.summaryVal, styles.summaryValHero]}>{finalSession?.score || score}</Text>
                <Text style={styles.summaryLabel}>Total Score</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryVal}>{attempts.filter((item) => item.is_correct).length}/{attempts.length}</Text>
                <Text style={styles.summaryLabel}>Correct</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryVal}>{finalSession?.max_streak || maxStreak}</Text>
                <Text style={styles.summaryLabel}>Max Streak</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryVal}>
                  {attempts.length > 0 ? (attempts.reduce((sum, item) => sum + item.responseTimeMs, 0) / attempts.length / 1000).toFixed(1) : '0'}s
                </Text>
                <Text style={styles.summaryLabel}>Avg Speed</Text>
              </View>
            </View>

            {finalSession?.sonara_coins_earned > 0 ? (
              <View style={styles.coinsEarned}><Text style={styles.coinsEarnedText}>💰 +{finalSession.sonara_coins_earned} Kannari Coins earned!</Text></View>
            ) : null}

            {finalSession?.leveled_up ? (
              <View style={styles.levelUpBanner}><Text style={styles.levelUpText}>🎉 Level Up! You unlocked Level {finalSession.new_level}!</Text></View>
            ) : null}

            <View style={styles.breakdownWrap}>
              <Text style={styles.breakdownTitle}>Question Breakdown</Text>
              <View style={styles.breakdownList}>
                {attempts.map((attempt, index) => (
                  <View key={index} style={[styles.breakdownItem, attempt.is_correct ? styles.breakdownCorrect : styles.breakdownWrong]}>
                    <View style={styles.breakdownNum}><Text style={styles.breakdownNumText}>{index + 1}</Text></View>
                    <View style={styles.breakdownBody}>
                      <Text style={styles.breakdownQuestion} numberOfLines={1}>{attempt.question}</Text>
                      <View style={styles.breakdownMeta}>
                        <Text style={[styles.breakdownCat, { color: catInfo(attempt.category).color }]}>{catInfo(attempt.category).icon} {catInfo(attempt.category).label}</Text>
                        {attempt.timedOut ? <Text style={styles.breakdownTimeout}>⏰ Timed out</Text> : <Text style={styles.breakdownTime}>{(attempt.responseTimeMs / 1000).toFixed(1)}s</Text>}
                        <Text style={styles.breakdownPts}>+{attempt.points} pts</Text>
                        {attempt.speedBonus > 0 ? <Text style={styles.breakdownSpeed}>⚡+{attempt.speedBonus}</Text> : null}
                      </View>
                    </View>
                    <Text style={styles.breakdownIcon}>{attempt.is_correct ? '✅' : '❌'}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryActions}>
              <TouchableOpacity
                style={styles.playAgainBtn}
                onPress={() => {
                  backToMenu();
                  setTimeout(() => startGame(), 120);
                }}
              >
                <Text style={styles.playAgainBtnText}>⚡ Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuBtn} onPress={backToMenu}>
                <Text style={styles.menuBtnText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </View>
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
    backgroundColor: '#f8fafc',
  },
  centerLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingCard: {
    minWidth: 230,
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
  sidebarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 999,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sidebarToggle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    marginRight: 10,
  },
  sidebarToggleText: {
    color: '#d97706',
    fontSize: 18,
    fontWeight: '700',
  },
  logoMini: {
    color: '#d97706',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    flex: 1,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scorePillPlaceholder: {
    width: 90,
  },
  scorePillText: {
    color: '#d97706',
    fontWeight: '800',
    fontSize: 13,
  },
  streakPill: {
    color: '#fff',
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  networkError: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  networkErrorText: {
    flex: 1,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissBtnText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  menuScroll: {
    padding: 16,
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: {
    color: '#d97706',
    fontSize: 20,
    fontWeight: '800',
  },
  statLbl: {
    color: '#64748b',
    marginTop: 3,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  subscribePrompt: {
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  subscribeIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  subscribeTitle: {
    color: '#b45309',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subscribeText: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
  },
  subscribeBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  subscribeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  levelBtn: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBtnSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fff7ed',
  },
  levelBtnLocked: {
    opacity: 0.35,
    borderColor: '#fed7aa',
  },
  levelBtnGated: {
    opacity: 0.55,
    borderColor: '#fed7aa',
  },
  levelBtnText: {
    color: '#64748b',
    fontWeight: '700',
  },
  levelHint: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 12,
  },
  startBtn: {
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 220,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 12,
    color: '#fca5a5',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  countdownWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
  },
  countdownNum: {
    color: '#d97706',
    fontSize: 78,
    fontWeight: '900',
  },
  gameArea: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  qCounter: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
  },
  progressDotDone: {
    backgroundColor: '#f59e0b',
  },
  progressDotCurrent: {
    backgroundColor: '#d97706',
  },
  timerWrap: {
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    position: 'relative',
  },
  timerBar: {
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f59e0b',
  },
  timerBarWarning: {
    backgroundColor: '#f97316',
  },
  timerBarDanger: {
    backgroundColor: '#ef4444',
  },
  timerText: {
    position: 'absolute',
    top: 10,
    left: '45%',
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  tickHint: {
    alignItems: 'center',
    marginBottom: 8,
  },
  tickHintText: {
    color: '#d97706',
    fontSize: 13,
  },
  catBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
    backgroundColor: '#fff7ed',
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  promptCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
  },
  promptText: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#dbeafe',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  choiceCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  choiceWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  choiceReveal: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    opacity: 0.75,
  },
  choiceKey: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    color: '#d97706',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  choiceText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  feedbackFlash: {
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  feedbackCorrect: {
    backgroundColor: '#f0fdf4',
  },
  feedbackWrong: {
    backgroundColor: '#fef2f2',
  },
  feedbackContent: {
    alignItems: 'center',
    gap: 6,
  },
  feedbackIcon: {
    fontSize: 38,
  },
  feedbackLabel: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  feedbackPointsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  feedbackPoints: {
    color: '#d97706',
    fontSize: 15,
    fontWeight: '700',
  },
  speedBonus: {
    color: '#fff',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  streakBonus: {
    color: '#fff',
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryWrap: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: '#64748b',
    fontSize: 14,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  summaryStat: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  summaryStatHero: {
    borderColor: '#f59e0b',
  },
  summaryVal: {
    color: '#d97706',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryValHero: {
    fontSize: 30,
  },
  summaryLabel: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  coinsEarned: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fff7ed',
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  coinsEarnedText: {
    color: '#b45309',
    fontSize: 16,
    fontWeight: '700',
  },
  levelUpBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  levelUpText: {
    color: '#15803d',
    fontWeight: '800',
    fontSize: 16,
  },
  breakdownWrap: {
    marginBottom: 16,
  },
  breakdownTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  breakdownList: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breakdownCorrect: {
    borderLeftColor: '#22c55e',
  },
  breakdownWrong: {
    borderLeftColor: '#ef4444',
  },
  breakdownNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownNumText: {
    color: '#d97706',
    fontWeight: '800',
    fontSize: 12,
  },
  breakdownBody: {
    flex: 1,
  },
  breakdownQuestion: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },
  breakdownMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  breakdownCat: {
    fontSize: 10,
    fontWeight: '700',
  },
  breakdownTime: {
    color: '#64748b',
    fontSize: 10,
  },
  breakdownTimeout: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  breakdownPts: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '700',
  },
  breakdownSpeed: {
    color: '#fff',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: 9,
    fontWeight: '800',
  },
  breakdownIcon: {
    fontSize: 18,
  },
  summaryActions: {
    gap: 10,
    alignItems: 'center',
  },
  playAgainBtn: {
    minWidth: 200,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  playAgainBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  menuBtn: {
    minWidth: 180,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MusicChallengeGame;
