import React, { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator} from 'react-native';
import { Audio } from 'expo-av';
import RhythmTimeline from './RhythmTimeline';
import {
  startGameSession,
  submitGameAttempt,
  finishGameSession,
  getStudentGamesOverview,
} from '../../services/gameService';

const SOUND_ASSETS = {
  click1200: require('../../../assets/sounds/rhythm/click_1200.wav'),
  click800: require('../../../assets/sounds/rhythm/click_800.wav'),
  click600: require('../../../assets/sounds/rhythm/click_600.wav'),
  click523: require('../../../assets/sounds/rhythm/click_523.wav'),
  click659: require('../../../assets/sounds/rhythm/click_659.wav'),
  click784: require('../../../assets/sounds/rhythm/click_784.wav'),
  click440: require('../../../assets/sounds/rhythm/click_440.wav'),
  click554: require('../../../assets/sounds/rhythm/click_554.wav'),
  click200: require('../../../assets/sounds/rhythm/click_200.wav'),
  click180: require('../../../assets/sounds/rhythm/click_180.wav'),
  click880: require('../../../assets/sounds/rhythm/click_880.wav'),
};

const getPayload = (response) => response?.data ?? response ?? {};

const PHASE = {
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  DEMO: 'demo',
  LISTEN_WAIT: 'listen_wait',
  TAPPING: 'tapping',
  SUBMITTING: 'submitting',
  FEEDBACK: 'feedback',
  SUMMARY: 'summary',
};

const GAME_LEVEL_CAP = 20;

const RhythmRushGame = () => {
  const navigation = useNavigation();

  const [studentId, setStudentId] = useState(null);
  const [phase, setPhase] = useState(PHASE.MENU);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(1);
  const [maxGameLevel, setMaxGameLevel] = useState(20);
  const [maxAccessibleLevel, setMaxAccessibleLevel] = useState(5);
  const [hasSubscription, setHasSubscription] = useState(true);

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const [expectedTs, setExpectedTs] = useState([]);
  const [noteTypes, setNoteTypes] = useState([]);
  const [bpm, setBpm] = useState(60);
  const [toleranceMs, setToleranceMs] = useState(150);
  const [patternDuration, setPatternDuration] = useState(4000);

  const [taps, setTaps] = useState([]);
  const [tapBase, setTapBase] = useState(null);
  const [playheadMs, setPlayheadMs] = useState(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const [lastResult, setLastResult] = useState(null);
  const [ripples, setRipples] = useState([]);

  const [summary, setSummary] = useState(null);
  const [countdownNum, setCountdownNum] = useState(3);

  const [networkError, setNetworkError] = useState('');
  const clearNetworkError = () => setNetworkError('');

  const sessionStartRef = useRef(null);
  const submittingRef = useRef(false);
  const tapTimerRef = useRef(null);
  const animRef = useRef(null);
  const doSubmitRef = useRef(null);
  const soundRef = useRef(null);

  const playAsset = useCallback(async (asset) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(asset, {
        shouldPlay: true,
        volume: 1,
      });

      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        }
      });
    } catch (_) {}
  }, []);

  const playMetronomeClick = useCallback((accent = false) => {
    playAsset(accent ? SOUND_ASSETS.click1200 : SOUND_ASSETS.click800);
  }, [playAsset]);

  const playTapSound = useCallback(() => {
    playAsset(SOUND_ASSETS.click600);
  }, [playAsset]);

  const playResultSound = useCallback((type) => {
    if (type === 'perfect') {
      setTimeout(() => playAsset(SOUND_ASSETS.click523), 0);
      setTimeout(() => playAsset(SOUND_ASSETS.click659), 80);
      setTimeout(() => playAsset(SOUND_ASSETS.click784), 160);
    } else if (type === 'good') {
      setTimeout(() => playAsset(SOUND_ASSETS.click440), 0);
      setTimeout(() => playAsset(SOUND_ASSETS.click554), 100);
    } else {
      setTimeout(() => playAsset(SOUND_ASSETS.click200), 0);
      setTimeout(() => playAsset(SOUND_ASSETS.click180), 150);
    }
  }, [playAsset]);

  const playCountdownBeep = useCallback((final = false) => {
    playAsset(final ? SOUND_ASSETS.click880 : SOUND_ASSETS.click440);
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
      } catch (loadError) {
        console.log('Failed to load student id', loadError);
        setLoading(false);
      }
    };

    loadStudentId();
  }, []);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getStudentGamesOverview(studentId);
        const overview = getPayload(res);
        const games = overview.games || [];

        let rr = null;
        if (Array.isArray(games)) {
          rr = games.find((g) => g.game?.game_type === 'rhythm_rush');
        } else {
          rr = games.rhythm_rush || Object.values(games).find((g) => g.game?.game_type === 'rhythm_rush');
        }

        if (rr) {
          setProfile(rr.profile);
          setMaxLevel(rr.profile?.highest_level_unlocked || 1);
          setSelectedLevel(rr.profile?.highest_level_unlocked || 1);
          setMaxGameLevel(Math.min(rr.game?.max_level || GAME_LEVEL_CAP, GAME_LEVEL_CAP));
          setMaxAccessibleLevel(rr.access?.max_accessible_level || 5);
          setHasSubscription(rr.access?.has_subscription !== false);
        }
      } catch (overviewError) {
        console.error(overviewError);
        setError('Failed to load game overview.');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  useEffect(() => () => {
    clearTimeout(tapTimerRef.current);
    if (animRef.current) {
      clearInterval(animRef.current);
    }
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
    }
  }, []);

  const setupQuestion = useCallback((question) => {
    const payload = question.question_payload || {};
    const timestamps = payload.expected_timestamps || [0, 1000, 2000, 3000];
    const types = payload.note_types || timestamps.map(() => 'quarter');
    const questionBpm = payload.bpm || 60;
    const tolerance = payload.tolerance_ms || 150;
    const duration = timestamps.length > 0 ? Math.max(...timestamps) + 800 : 4000;

    setExpectedTs(timestamps);
    setNoteTypes(types);
    setBpm(questionBpm);
    setToleranceMs(tolerance);
    setPatternDuration(duration);
    setTaps([]);
    setPlayheadMs(null);
    setLastResult(null);
    submittingRef.current = false;
  }, []);

  const startDemo = useCallback(() => {
    setPhase(PHASE.DEMO);
    setPlayheadMs(0);

    const startTime = Date.now();

    expectedTs.forEach((timestamp, index) => {
      setTimeout(() => playMetronomeClick(index === 0), timestamp);
    });

    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setPlayheadMs(elapsed);

      if (elapsed >= patternDuration) {
        clearInterval(animRef.current);
        setPlayheadMs(null);
        setTimeout(() => {
          setPhase(PHASE.LISTEN_WAIT);
          setTimeout(() => {
            setTaps([]);
            setPlayheadMs(0);
            setPhase(PHASE.TAPPING);
            const tapStart = Date.now();
            setTapBase(tapStart);

            if (animRef.current) clearInterval(animRef.current);
            animRef.current = setInterval(() => {
              const tapElapsed = Date.now() - tapStart;
              setPlayheadMs(tapElapsed);
              if (tapElapsed >= patternDuration + 500) {
                clearInterval(animRef.current);
                setPlayheadMs(null);
              }
            }, 16);
          }, 800);
        }, 300);
      }
    }, 16);
  }, [expectedTs, patternDuration]);

  useEffect(() => {
    if (phase !== PHASE.COUNTDOWN) return;

    if (countdownNum <= 0) {
      startDemo();
      return;
    }

    playCountdownBeep(countdownNum === 1);
    const timeoutId = setTimeout(() => setCountdownNum((prev) => prev - 1), 700);

    return () => clearTimeout(timeoutId);
  }, [phase, countdownNum, startDemo]);

  const startGame = async () => {
    if (!studentId || submittingRef.current) return;

    if (!hasSubscription) {
      setError('Subscription required to play games.');
      return;
    }

    if (selectedLevel > maxAccessibleLevel) {
      setError('This level is locked by your current subscription.');
      return;
    }

    setError('');
    setNetworkError('');

    try {
      submittingRef.current = true;
      const res = await startGameSession(studentId, 'rhythm_rush', selectedLevel);
      const data = getPayload(res);

      if (data.bool === false) {
        setError(data.message || 'Failed to start game session.');
        return;
      }

      setSession(data.session);
      setQuestions(data.questions || []);
      setCurrentQIndex(0);

      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setCorrectCount(0);
      setWrongCount(0);
      setSummary(null);

      sessionStartRef.current = Date.now();

      if (data.questions?.length > 0) {
        setupQuestion(data.questions[0]);
      }

      setCountdownNum(3);
      setPhase(PHASE.COUNTDOWN);
    } catch (startError) {
      console.error(startError);
      setError(startError?.response?.data?.message || 'Could not start session');
    } finally {
      submittingRef.current = false;
    }
  };

  const doFinish = useCallback(async () => {
    if (!session) return;

    const elapsed = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : 60;

    try {
      const res = await finishGameSession(session.id, { time_spent_seconds: elapsed });
      const data = getPayload(res);
      setSummary(data);
      if (data.level_up) {
        setMaxLevel(data.profile.highest_level_unlocked);
        playResultSound('perfect');
      }
      setPhase(PHASE.SUMMARY);
    } catch (finishError) {
      console.error(finishError);
      setSummary({
        session: {
          score,
          max_streak: maxStreak,
          correct_count: correctCount,
          wrong_count: wrongCount,
        },
        coins_earned: 0,
      });
      setPhase(PHASE.SUMMARY);
    }
  }, [session, score, maxStreak, correctCount, wrongCount]);

  const doSubmitAttempt = useCallback(async () => {
    if (submittingRef.current || !session) return;

    submittingRef.current = true;

    clearTimeout(tapTimerRef.current);
    if (animRef.current) clearInterval(animRef.current);

    setPhase(PHASE.SUBMITTING);

    const question = questions[currentQIndex];
    if (!question) {
      submittingRef.current = false;
      return;
    }

    try {
      const res = await submitGameAttempt(session.id, {
        question_id: question.id,
        expected_timestamps: expectedTs,
        taps,
        tolerance_ms: toleranceMs,
      });

      const data = getPayload(res);
      const result = data.attempt_result || { feedback: 'try_again', is_correct: false, points: 0 };

      setLastResult(result);
      setScore(data.session?.score ?? score);
      setStreak(data.session?.streak ?? streak);
      setMaxStreak(data.session?.max_streak ?? maxStreak);

      if (result.is_correct) {
        setCorrectCount((prev) => prev + 1);
        playResultSound(result.feedback);
      } else {
        setWrongCount((prev) => prev + 1);
        playResultSound('try_again');
      }

      setPhase(PHASE.FEEDBACK);

      setTimeout(() => {
        const nextIndex = currentQIndex + 1;
        if (nextIndex >= questions.length) {
          doFinish();
        } else {
          setCurrentQIndex(nextIndex);
          setupQuestion(questions[nextIndex]);
          setCountdownNum(3);
          setPhase(PHASE.COUNTDOWN);
        }
      }, 2500);
    } catch (submitError) {
      console.error('Submit error', submitError);

      const isNetworkError = !submitError.response;
      if (isNetworkError) {
        setNetworkError('Network error — your tap may not have been recorded.');
        setTimeout(() => clearNetworkError(), 4000);
      }

      setPhase(PHASE.FEEDBACK);
      setLastResult({ feedback: 'try_again', is_correct: false, points: 0 });

      setTimeout(() => {
        const nextIndex = currentQIndex + 1;
        if (nextIndex >= questions.length) {
          doFinish();
        } else {
          setCurrentQIndex(nextIndex);
          setupQuestion(questions[nextIndex]);
          setCountdownNum(3);
          setPhase(PHASE.COUNTDOWN);
        }
      }, isNetworkError ? 3000 : 2000);
    }

    submittingRef.current = false;
  }, [session, questions, currentQIndex, expectedTs, taps, toleranceMs, doFinish, setupQuestion, score, streak, maxStreak]);

  useEffect(() => {
    doSubmitRef.current = doSubmitAttempt;
  }, [doSubmitAttempt]);

  useEffect(() => {
    if (phase === PHASE.TAPPING) {
      tapTimerRef.current = setTimeout(() => {
        if (animRef.current) clearInterval(animRef.current);
        setPlayheadMs(null);
        if (doSubmitRef.current) doSubmitRef.current();
      }, patternDuration + 600);

      return () => clearTimeout(tapTimerRef.current);
    }

    return undefined;
  }, [phase, patternDuration]);

  const handleTap = useCallback(() => {
    if (phase !== PHASE.TAPPING || !tapBase) return;

    const elapsed = Date.now() - tapBase;
    playTapSound();

    setTaps((prev) => [...prev, elapsed]);

    const rippleId = Date.now();
    setRipples((prev) => [...prev, rippleId]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((id) => id !== rippleId));
    }, 600);
  }, [phase, tapBase]);

  const currentQuestion = questions[currentQIndex] || null;
  const isActive = [
    PHASE.DEMO,
    PHASE.LISTEN_WAIT,
    PHASE.TAPPING,
    PHASE.SUBMITTING,
    PHASE.FEEDBACK,
  ].includes(phase);

  const timelinePhase = phase === PHASE.FEEDBACK
    ? 'result'
    : phase === PHASE.TAPPING
      ? 'listening'
      : phase === PHASE.DEMO
        ? 'playing'
        : 'idle';

  if (loading) {
    return (
          <View style={styles.centerLoadingWrap}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.loadingText}>Loading Rhythm Rush...</Text>
            </View>
          </View>
    );
  }

  return (
    <>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('StudentGamesHub')}>
            <Text style={styles.backBtnText}>← Games</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🥁 Rhythm Rush</Text>
          <View style={styles.coinsPill}>
            <Text style={styles.coinsPillText}>🪙 {profile?.sonara_coins || 0}</Text>
          </View>
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
            <View style={styles.heroCard}>
              <View style={styles.heroVisual}>
                <Text style={styles.heroDrum}>🥁</Text>
                <View style={styles.heroBeats}>
                  {['♩', '♩', '♪', '♪', '♩'].map((note, index) => (
                    <Text key={index} style={styles.heroNote}>{note}</Text>
                  ))}
                </View>
              </View>

              <Text style={styles.heroTitle}>Tap to the rhythm!</Text>
              <Text style={styles.heroSubtitle}>
                Listen to the pattern, then tap it back with precise timing. Earn points for accuracy!
              </Text>

              {!hasSubscription ? (
                <View style={styles.subscribePrompt}>
                  <Text style={styles.subscribeIcon}>🔒</Text>
                  <Text style={styles.subscribeTitle}>Subscription Required</Text>
                  <Text style={styles.subscribeText}>Subscribe to unlock Sonara Games and start earning coins!</Text>
                  <TouchableOpacity style={styles.subscribeBtn} onPress={() => navigation.navigate('StudentSubscriptions')}>
                    <Text style={styles.subscribeBtnText}>🥁 Subscribe to Play</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {profile ? (
                    <View style={styles.statsRow}>
                      <View style={styles.stat}><Text style={styles.statVal}>{profile.best_score}</Text><Text style={styles.statLbl}>Best Score</Text></View>
                      <View style={styles.stat}><Text style={styles.statVal}>{profile.best_streak}</Text><Text style={styles.statLbl}>Best Streak</Text></View>
                      <View style={styles.stat}><Text style={styles.statVal}>{profile.accuracy_percent}%</Text><Text style={styles.statLbl}>Accuracy</Text></View>
                      <View style={styles.stat}><Text style={styles.statVal}>{profile.sonara_coins}</Text><Text style={styles.statLbl}>Coins</Text></View>
                    </View>
                  ) : null}

                  <View style={styles.levelSelect}>
                    <Text style={styles.levelTitle}>Select Level</Text>
                    <View style={styles.levelsWrap}>
                      {Array.from({ length: Math.min(maxGameLevel || GAME_LEVEL_CAP, GAME_LEVEL_CAP) }, (_, i) => i + 1).map((lvl) => {
                        const unlocked = lvl <= maxLevel;
                        const accessible = lvl <= maxAccessibleLevel;
                        const current = lvl === selectedLevel;

                        return (
                          <TouchableOpacity
                            key={lvl}
                            disabled={!unlocked || !accessible}
                            onPress={() => setSelectedLevel(lvl)}
                            style={[
                              styles.levelBtn,
                              current && styles.levelActive,
                              !unlocked && styles.levelLocked,
                              unlocked && !accessible && styles.levelGated,
                            ]}
                          >
                            <Text style={styles.levelBtnText}>{unlocked && accessible ? lvl : '🔒'}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <TouchableOpacity style={styles.playBtn} onPress={startGame}>
                    <Text style={styles.playBtnText}>▶ Play Level {selectedLevel}</Text>
                  </TouchableOpacity>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </>
              )}
            </View>
          </ScrollView>
        ) : null}

        {phase === PHASE.COUNTDOWN ? (
          <View style={styles.countdownWrap}>
            <Text style={styles.countdownNum}>{countdownNum > 0 ? countdownNum : 'GO!'}</Text>
            <Text style={styles.countdownTip}>Pattern {currentQIndex + 1} / {questions.length}</Text>
          </View>
        ) : null}

        {isActive && currentQuestion ? (
          <ScrollView contentContainerStyle={styles.gameArea}>
            <View style={styles.progressRow}>
              <Text style={styles.qCounter}>Pattern {currentQIndex + 1} / {questions.length}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentQIndex + (phase === PHASE.FEEDBACK ? 1 : 0)) / questions.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.levelBadge}>Lv.{session?.level}</Text>
            </View>

            <View style={styles.hud}>
              <View style={styles.hudItem}><Text style={styles.hudLabel}>Score</Text><Text style={styles.hudValue}>{score}</Text></View>
              <View style={styles.hudItem}><Text style={styles.hudLabel}>BPM</Text><Text style={[styles.hudValue, styles.bpmValue]}>{bpm}</Text></View>
              <View style={styles.hudItem}><Text style={styles.hudLabel}>Streak</Text><Text style={[styles.hudValue, streak >= 2 && styles.streakHot]}>{streak > 0 ? `🔥${streak}` : '—'}</Text></View>
              <View style={styles.hudItem}><Text style={styles.hudLabel}>Correct</Text><Text style={styles.hudValue}>{correctCount}/{correctCount + wrongCount}</Text></View>
            </View>

            <Text style={styles.prompt}>{currentQuestion.prompt}</Text>

            <View
              style={[
                styles.phaseIndicator,
                phase === PHASE.TAPPING && styles.phaseTap,
                phase === PHASE.DEMO && styles.phaseDemo,
              ]}
            >
              <Text style={styles.phaseText}>
                {phase === PHASE.DEMO ? '👂 Listen to the pattern...'
                  : phase === PHASE.LISTEN_WAIT ? '🎯 Get ready to tap!'
                    : phase === PHASE.TAPPING ? '🥁 TAP NOW!'
                      : phase === PHASE.SUBMITTING ? '⏳ Analyzing...'
                        : ''}
              </Text>
            </View>

            <View style={styles.timelineWrap}>
              <RhythmTimeline
                noteTypes={noteTypes}
                expectedTimestamps={expectedTs}
                taps={taps}
                toleranceMs={toleranceMs}
                totalDurationMs={patternDuration}
                playheadMs={playheadMs}
                phase={timelinePhase}
                width={560}
                height={140}
              />
            </View>

            {phase === PHASE.TAPPING ? (
              <Pressable style={styles.tapZone} onPress={handleTap}>
                <View style={styles.tapCircle}>
                  <Text style={styles.tapLabel}>TAP</Text>
                  {ripples.map((id) => (
                    <View key={id} style={styles.tapRipple} />
                  ))}
                </View>
                <Text style={styles.tapHint}>Tap here</Text>
                <Text style={styles.tapCount}>Taps: {taps.length} / {expectedTs.length}</Text>
              </Pressable>
            ) : null}

            {phase === PHASE.TAPPING && taps.length >= expectedTs.length ? (
              <TouchableOpacity
                style={styles.submitEarlyBtn}
                onPress={() => {
                  clearTimeout(tapTimerRef.current);
                  if (animRef.current) clearInterval(animRef.current);
                  setPlayheadMs(null);
                  if (doSubmitRef.current) doSubmitRef.current();
                }}
              >
                <Text style={styles.submitEarlyText}>✓ Submit Pattern</Text>
              </TouchableOpacity>
            ) : null}

            {phase === PHASE.FEEDBACK && lastResult ? (
              <View
                style={[
                  styles.feedbackOverlay,
                  lastResult.feedback === 'perfect' && styles.fbPerfect,
                  lastResult.feedback === 'good' && styles.fbGood,
                  lastResult.feedback === 'try_again' && styles.fbTryAgain,
                ]}
              >
                <Text style={styles.feedbackIcon}>
                  {lastResult.feedback === 'perfect' ? '⭐' : lastResult.feedback === 'good' ? '👍' : '🔄'}
                </Text>
                <Text style={styles.feedbackText}>
                  {lastResult.feedback === 'perfect' ? 'PERFECT!'
                    : lastResult.feedback === 'good' ? 'GOOD' : 'TRY AGAIN'}
                </Text>
                <Text style={styles.feedbackPoints}>+{lastResult.points} pts</Text>
              </View>
            ) : null}
          </ScrollView>
        ) : null}

        {phase === PHASE.SUMMARY ? (
          <ScrollView contentContainerStyle={styles.summaryWrap}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{summary?.level_up ? '🎉 Level Up!' : '🏁 Session Complete!'}</Text>

              {summary?.level_up ? (
                <View style={styles.levelUpBanner}>
                  <Text style={styles.levelUpText}>Level {summary.new_level_unlocked} Unlocked!</Text>
                </View>
              ) : null}

              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}><Text style={styles.summaryVal}>{summary?.session?.score ?? score}</Text><Text style={styles.summaryLbl}>Score</Text></View>
                <View style={styles.summaryStat}><Text style={styles.summaryVal}>{summary?.session_accuracy ?? 0}%</Text><Text style={styles.summaryLbl}>Accuracy</Text></View>
                <View style={styles.summaryStat}><Text style={[styles.summaryVal, styles.summaryCoinsVal]}>🪙 +{summary?.coins_earned ?? 0}</Text><Text style={styles.summaryLbl}>Coins</Text></View>
                <View style={styles.summaryStat}><Text style={styles.summaryVal}>🔥 {summary?.session?.max_streak ?? maxStreak}</Text><Text style={styles.summaryLbl}>Best Streak</Text></View>
              </View>

              <View style={styles.summaryBreakdown}>
                <Text style={styles.sbCorrect}>✅ {correctCount} correct</Text>
                <Text style={styles.sbWrong}>❌ {wrongCount} wrong</Text>
                <Text style={styles.sbTotal}>of {questions.length} patterns</Text>
              </View>

              {summary?.badges_awarded?.length > 0 ? (
                <View style={styles.badgesSection}>
                  <Text style={styles.badgesTitle}>🏅 Badges Earned!</Text>
                  {summary.badges_awarded.map((badge, index) => (
                    <Text key={index} style={styles.badgeItem}>• {badge.title || badge.badge_key}</Text>
                  ))}
                </View>
              ) : null}

              <View style={styles.summaryActions}>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => {
                    if (summary?.level_up) {
                      setMaxLevel(summary.profile.highest_level_unlocked);
                      setSelectedLevel(summary.profile.highest_level_unlocked);
                    }
                    setProfile(summary?.profile || profile);
                    setPhase(PHASE.MENU);
                  }}
                >
                  <Text style={styles.playBtnText}>
                    {summary?.level_up
                      ? `▶ Play Level ${summary.profile?.highest_level_unlocked ?? selectedLevel + 1}`
                      : '🔄 Play Again'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('StudentGamesHub')}>
                  <Text style={styles.secondaryBtnText}>Back to Games</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : null}
    </>
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
    minWidth: 210,
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
    backgroundColor: '#f5f3ff',
    marginRight: 10,
  },
  sidebarToggleText: {
    color: '#7c3aed',
    fontSize: 18,
    fontWeight: '700',
  },
  logoMini: {
    color: '#7c3aed',
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
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
  coinsPill: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  coinsPillText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 13,
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
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroVisual: {
    alignItems: 'center',
    marginBottom: 14,
  },
  heroDrum: {
    fontSize: 56,
  },
  heroBeats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  heroNote: {
    fontSize: 24,
    color: '#7c3aed',
  },
  heroTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
  },
  subscribePrompt: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fff7ed',
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
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
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
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  stat: {
    minWidth: 90,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statVal: {
    color: '#7c3aed',
    fontSize: 18,
    fontWeight: '700',
  },
  statLbl: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  levelSelect: {
    width: '100%',
    marginBottom: 14,
  },
  levelTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  levelBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },
  levelActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#7c3aed',
  },
  levelLocked: {
    opacity: 0.4,
  },
  levelGated: {
    borderColor: '#fdba74',
  },
  playBtn: {
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  playBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'center',
  },
  countdownWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNum: {
    fontSize: 72,
    fontWeight: '900',
    color: '#7c3aed',
  },
  countdownTip: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
  },
  gameArea: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  qCounter: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },
  levelBadge: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hudItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  hudLabel: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 2,
  },
  hudValue: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  bpmValue: {
    color: '#7c3aed',
  },
  streakHot: {
    color: '#f97316',
  },
  prompt: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
  },
  phaseIndicator: {
    minHeight: 40,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  phaseDemo: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  phaseTap: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  phaseText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  timelineWrap: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tapZone: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  tapCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tapLabel: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    zIndex: 2,
  },
  tapRipple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.35)',
  },
  tapHint: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 12,
  },
  tapCount: {
    marginTop: 4,
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
  },
  submitEarlyBtn: {
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  submitEarlyText: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 14,
  },
  feedbackOverlay: {
    marginTop: 14,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  fbPerfect: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  fbGood: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  fbTryAgain: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  feedbackIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  feedbackText: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  feedbackPoints: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
  },
  summaryWrap: {
    padding: 18,
    alignItems: 'center',
  },
  summaryCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  summaryTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  levelUpBanner: {
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  levelUpText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  summaryStats: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  summaryStat: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryVal: {
    color: '#7c3aed',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryCoinsVal: {
    color: '#f59e0b',
  },
  summaryLbl: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  summaryBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sbCorrect: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '700',
  },
  sbWrong: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  sbTotal: {
    color: '#64748b',
    fontSize: 13,
  },
  badgesSection: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fff7ed',
    padding: 12,
    marginBottom: 12,
  },
  badgesTitle: {
    color: '#b45309',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeItem: {
    color: '#b45309',
    fontSize: 13,
  },
  summaryActions: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RhythmRushGame;
