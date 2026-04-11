import React, { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator} from 'react-native';
import { Audio } from 'expo-av';
import MusicStaff from './MusicStaff';
import {
  startGameSession,
  submitGameAttempt,
  finishGameSession,
  getStudentGamesOverview,
} from '../../services/gameService';

const SOUND_ASSETS = {
  click200: require('../../../assets/sounds/rhythm/click_200.wav'),
  click180: require('../../../assets/sounds/rhythm/click_180.wav'),
  click440: require('../../../assets/sounds/rhythm/click_440.wav'),
  click523: require('../../../assets/sounds/rhythm/click_523.wav'),
  click554: require('../../../assets/sounds/rhythm/click_554.wav'),
  click659: require('../../../assets/sounds/rhythm/click_659.wav'),
  click784: require('../../../assets/sounds/rhythm/click_784.wav'),
  click880: require('../../../assets/sounds/rhythm/click_880.wav'),
};

const getPayload = (response) => response?.data ?? response ?? {};

const PHASE = {
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  FEEDBACK: 'feedback',
  SUMMARY: 'summary',
};

const GAME_LEVEL_CAP = 20;

const NoteNinjaGame = () => {
  const navigation = useNavigation();

  const [studentId, setStudentId] = useState(null);
  const [phase, setPhase] = useState(PHASE.MENU);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState(null);
  const [maxLevel, setMaxLevel] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerPercent, setTimerPercent] = useState(100);
  const [timerColor, setTimerColor] = useState('#06bbcc');

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const [summary, setSummary] = useState(null);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [staffHighlight, setStaffHighlight] = useState(null);

  const [countdownNum, setCountdownNum] = useState(3);

  const timerRef = useRef(null);
  const advanceRef = useRef(null);
  const sessionStartRef = useRef(null);
  const submittingRef = useRef(false);
  const soundRefs = useRef([]);

  const [networkError, setNetworkError] = useState('');
  const clearNetworkError = () => setNetworkError('');

  const playAsset = useCallback(async (asset) => {
    try {
      const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true, volume: 1 });
      soundRefs.current.push(sound);
      if (soundRefs.current.length > 8) {
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

  const playCorrectSound = useCallback(() => {
    setTimeout(() => playAsset(SOUND_ASSETS.click523), 0);
    setTimeout(() => playAsset(SOUND_ASSETS.click659), 100);
    setTimeout(() => playAsset(SOUND_ASSETS.click784), 200);
  }, [playAsset]);

  const playIncorrectSound = useCallback(() => {
    setTimeout(() => playAsset(SOUND_ASSETS.click200), 0);
    setTimeout(() => playAsset(SOUND_ASSETS.click180), 150);
  }, [playAsset]);

  const playLevelUpSound = useCallback(() => {
    [SOUND_ASSETS.click523, SOUND_ASSETS.click554, SOUND_ASSETS.click659, SOUND_ASSETS.click784, SOUND_ASSETS.click880]
      .forEach((asset, index) => setTimeout(() => playAsset(asset), index * 90));
  }, [playAsset]);

  const playStartSound = useCallback(() => {
    setTimeout(() => playAsset(SOUND_ASSETS.click440), 0);
    setTimeout(() => playAsset(SOUND_ASSETS.click554), 80);
    setTimeout(() => playAsset(SOUND_ASSETS.click659), 160);
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
        const data = getPayload(res);
        const noteNinja = data.games?.note_ninja;
        if (!noteNinja) {
          setError('Note Ninja profile not found.');
        } else {
          setProfile(noteNinja);
          setMaxLevel(Math.max(1, noteNinja.highest_level_unlocked || 1));
          setSelectedLevel(Math.max(1, noteNinja.highest_level_unlocked || 1));
        }
      } catch (overviewError) {
        console.log(overviewError);
        setError('Failed to load game overview.');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  useEffect(() => {
    if (phase !== PHASE.PLAYING) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(prev - 0.1, 0);
        const pct = (next / 10) * 100;
        setTimerPercent(pct);
        if (pct > 60) setTimerColor('#06bbcc');
        else if (pct > 30) setTimerColor('#f59e0b');
        else setTimerColor('#ef4444');

        if (next <= 0) {
          clearInterval(timerRef.current);
          handleAnswer(null);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [phase, currentQIndex]);

  useEffect(() => {
    if (phase !== PHASE.PLAYING) return;
    setSelectedAnswer(null);
  }, [phase, currentQIndex]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearTimeout(advanceRef.current);
    soundRefs.current.forEach((sound) => {
      sound.unloadAsync().catch(() => {});
    });
    soundRefs.current = [];
  }, []);

  const maxGameLevel = profile?.max_game_level ?? GAME_LEVEL_CAP;
  const hasSubscription = maxGameLevel > 0;
  const maxAccessibleLevel = Math.min(maxGameLevel, GAME_LEVEL_CAP);

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
      const res = await startGameSession(studentId, 'note_ninja', selectedLevel);
      const data = getPayload(res);

      const fetchedQuestions = data.questions || [];
      if (!fetchedQuestions.length) {
        setError('No questions returned for this level.');
        return;
      }

      setSession(data.session);
      setQuestions(fetchedQuestions);

      setCurrentQIndex(0);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setCorrectCount(0);
      setWrongCount(0);
      setLastResult(null);
      setSummary(null);
      setStaffHighlight(null);
      setShowStreakBonus(false);
      setTimeLeft(10);
      setTimerPercent(100);
      setTimerColor('#06bbcc');

      sessionStartRef.current = Date.now();

      setCountdownNum(3);
      setPhase(PHASE.COUNTDOWN);
      playStartSound();

      const countdownInterval = setInterval(() => {
        setCountdownNum((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setTimeout(() => {
              setPhase(PHASE.PLAYING);
            }, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 800);
    } catch (startError) {
      console.error('Start game error:', startError);

      if (startError.response?.status === 404) {
        setError('Game API not available. Please contact support.');
      } else if (startError.response?.status >= 500) {
        setNetworkError('Server is temporarily unavailable. Please try again.');
      } else if (startError.response?.data?.error) {
        setError(startError.response.data.error);
      } else {
        setError('Unable to start game. Please try again.');
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const finishGame = useCallback(async (finalCorrect = correctCount, finalWrong = wrongCount) => {
    if (!session?.id || submittingRef.current) return;

    try {
      submittingRef.current = true;
      const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const res = await finishGameSession(session.id, {
        duration_seconds: duration,
      });
      const data = getPayload(res);

      setSummary(data);
      setPhase(PHASE.SUMMARY);

      const expectedAccuracy = finalCorrect + finalWrong > 0
        ? Math.round((finalCorrect / (finalCorrect + finalWrong)) * 100)
        : 0;
      const serverAccuracy = data.session_accuracy ?? expectedAccuracy;

      if (serverAccuracy >= 70 && data.level_up) {
        playLevelUpSound();
      }

      if (data.profile) {
        setProfile(data.profile);
        setMaxLevel(Math.max(1, data.profile.highest_level_unlocked || maxLevel));
      }
    } catch (finishError) {
      console.error(finishError);
      setError('Could not finish session cleanly. Your progress may still be saved.');
      setPhase(PHASE.SUMMARY);
    } finally {
      submittingRef.current = false;
    }
  }, [session, correctCount, wrongCount, maxLevel]);

  const goNextOrFinish = useCallback(async (nextCorrect = correctCount, nextWrong = wrongCount) => {
    const isLast = currentQIndex >= questions.length - 1;

    if (isLast) {
      await finishGame(nextCorrect, nextWrong);
      return;
    }

    setCurrentQIndex((idx) => idx + 1);
    setLastResult(null);
    setSelectedAnswer(null);
    setStaffHighlight(null);
    setTimeLeft(10);
    setTimerPercent(100);
    setTimerColor('#06bbcc');
    setPhase(PHASE.PLAYING);
  }, [currentQIndex, questions.length, finishGame, correctCount, wrongCount]);

  const handleAnswer = async (choice) => {
    if (phase !== PHASE.PLAYING || !currentQuestion || submittingRef.current) return;

    clearInterval(timerRef.current);

    setSelectedAnswer(choice);

    const rtMs = Math.round((10 - timeLeft) * 1000);
    const payload = {
      note_chosen: choice,
      reaction_time_ms: rtMs,
      timed_out: choice === null,
    };

    try {
      submittingRef.current = true;
      const res = await submitGameAttempt(session.id, {
        question_id: currentQuestion.id,
        ...payload,
      });
      const attemptData = getPayload(res);
      const result = attemptData.attempt_result || attemptData;
      setLastResult(result);
      setPhase(PHASE.FEEDBACK);

      if (result.is_correct) {
        playCorrectSound();
        setStaffHighlight('correct');
        setScore((v) => v + (result.points || 0));
        setStreak((s) => {
          const nextStreak = s + 1;
          setMaxStreak((m) => Math.max(m, nextStreak));
          if (result.streak_bonus_points > 0) {
            setShowStreakBonus(true);
            setTimeout(() => setShowStreakBonus(false), 900);
          }
          return nextStreak;
        });
        setCorrectCount((v) => v + 1);
      } else {
        playIncorrectSound();
        setStaffHighlight('incorrect');
        setStreak(0);
        setWrongCount((v) => v + 1);
      }

      const nextCorrect = result.is_correct ? correctCount + 1 : correctCount;
      const nextWrong = result.is_correct ? wrongCount : wrongCount + 1;

      advanceRef.current = setTimeout(() => {
        goNextOrFinish(nextCorrect, nextWrong);
      }, 850);
    } catch (submitError) {
      console.error(submitError);

      if (submitError.response?.status >= 500) {
        setNetworkError('Connection issue while submitting answer. Your progress is being retried.');
      } else {
        setError('Could not submit answer.');
      }

      setPhase(PHASE.PLAYING);
      setTimeLeft(Math.max(3, timeLeft));
    } finally {
      submittingRef.current = false;
    }
  };

  const currentQuestion = questions[currentQIndex];

  const noteName = currentQuestion?.note || 'C4';
  const noteClef = currentQuestion?.clef || 'treble';

  if (loading) {
    return (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading Note Ninja...</Text>
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

          <Text style={styles.title}>🎵 Note Ninja</Text>

          <View style={styles.coinsPill}>
            <Text style={styles.coinsPillText}>🪙 {profile?.sonara_coins || 0}</Text>
          </View>
        </View>

        {networkError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {networkError}</Text>
            <TouchableOpacity onPress={clearNetworkError} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {phase === PHASE.MENU ? (
          <ScrollView contentContainerStyle={styles.menuScroll}>
            <View style={styles.heroCard}>
              <View style={styles.heroVisual}>
                <MusicStaff clef="treble" note="G4" width={280} height={160} />
              </View>

              <Text style={styles.heroTitle}>Identify notes on the music staff!</Text>
              <Text style={styles.heroSubtitle}>
                Test your note reading speed. Score points, build streaks, and earn Kannari Coins.
              </Text>

              {!hasSubscription ? (
                <View style={styles.subscribePrompt}>
                  <Text style={styles.subscribeIcon}>🔒</Text>
                  <Text style={styles.subscribeTitle}>Subscription Required</Text>
                  <Text style={styles.subscribeText}>Subscribe to unlock Sonara Games and start earning coins!</Text>
                  <TouchableOpacity style={styles.subscribeBtn} onPress={() => navigation.navigate('StudentSubscriptions')}>
                    <Text style={styles.subscribeBtnText}>🎵 Subscribe to Play</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {profile ? (
                    <View style={styles.statsRow}>
                      <View style={styles.statCard}><Text style={styles.statVal}>{profile.best_score}</Text><Text style={styles.statLbl}>Best Score</Text></View>
                      <View style={styles.statCard}><Text style={styles.statVal}>{profile.best_streak}</Text><Text style={styles.statLbl}>Best Streak</Text></View>
                      <View style={styles.statCard}><Text style={styles.statVal}>{profile.accuracy_percent}%</Text><Text style={styles.statLbl}>Accuracy</Text></View>
                      <View style={styles.statCard}><Text style={styles.statVal}>{profile.sonara_coins}</Text><Text style={styles.statLbl}>Coins</Text></View>
                    </View>
                  ) : null}

                  <View style={styles.levelSelect}>
                    <Text style={styles.levelTitle}>Select Level</Text>
                    <View style={styles.levelsWrap}>
                      {Array.from({ length: Math.min(maxGameLevel || GAME_LEVEL_CAP, GAME_LEVEL_CAP) }, (_, i) => i + 1).map((lvl) => {
                        const unlocked = lvl <= maxLevel;
                        const accessible = lvl <= maxAccessibleLevel;
                        const isCurrent = lvl === selectedLevel;

                        return (
                          <TouchableOpacity
                            key={lvl}
                            disabled={!unlocked || !accessible}
                            onPress={() => setSelectedLevel(lvl)}
                            style={[
                              styles.levelBtn,
                              isCurrent && styles.levelBtnActive,
                              !unlocked && styles.levelBtnLocked,
                              unlocked && !accessible && styles.levelBtnGated,
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
            <Text style={styles.countdownNum} key={countdownNum}>
              {countdownNum > 0 ? countdownNum : 'GO!'}
            </Text>
          </View>
        ) : null}

        {(phase === PHASE.PLAYING || phase === PHASE.FEEDBACK) && currentQuestion ? (
          <ScrollView contentContainerStyle={styles.gameArea}>
            <View style={styles.progressRow}>
              <Text style={styles.qCounter}>
                Q {currentQIndex + 1} / {questions.length}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((currentQIndex + (phase === PHASE.FEEDBACK ? 1 : 0)) / questions.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.levelBadge}>Lv.{session?.level}</Text>
            </View>

            <View style={styles.timerBar}>
              <View style={[styles.timerFill, { width: `${timerPercent}%`, backgroundColor: timerColor }]} />
              <Text style={styles.timerText}>{Math.ceil(timeLeft)}s</Text>
            </View>

            <View style={styles.hudRow}>
              <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>Score</Text>
                <Text style={[styles.hudValue, styles.scoreValue]}>{score}</Text>
              </View>
              <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>Streak</Text>
                <Text style={[styles.hudValue, streak >= 3 && styles.streakHot]}>
                  {streak > 0 ? '🔥'.repeat(Math.min(streak, 5)) : '—'}
                  {streak > 0 ? ` ${streak}` : ''}
                </Text>
                {showStreakBonus ? <Text style={styles.streakBonus}>+streak bonus!</Text> : null}
              </View>
              <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>Correct</Text>
                <Text style={styles.hudValue}>{correctCount}/{correctCount + wrongCount}</Text>
              </View>
            </View>

            <View style={styles.staffWrap}>
              <MusicStaff
                clef={noteClef}
                note={noteName}
                highlight={staffHighlight}
                width={360}
                height={190}
              />
            </View>

            <Text style={styles.prompt}>{currentQuestion.prompt}</Text>

            <View style={styles.choicesWrap} key={currentQuestion.id}>
              {(currentQuestion.choices || []).map((choice, i) => {
                let dynamicStyle = null;
                if (phase === PHASE.FEEDBACK && lastResult) {
                  if (lastResult.is_correct && choice === selectedAnswer) {
                    dynamicStyle = styles.choiceCorrect;
                  } else if (!lastResult.is_correct && choice === selectedAnswer) {
                    dynamicStyle = styles.choiceIncorrect;
                  }
                }
                return (
                  <TouchableOpacity
                    key={`${currentQuestion.id}-${i}`}
                    style={[styles.choiceBtn, phase === PHASE.FEEDBACK && styles.choiceDisabled, dynamicStyle]}
                    disabled={phase === PHASE.FEEDBACK}
                    onPress={() => handleAnswer(choice)}
                  >
                    <Text style={[styles.choiceText, dynamicStyle && styles.choiceTextActive]}>{choice}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {phase === PHASE.FEEDBACK && lastResult ? (
              <View style={[styles.feedbackBanner, lastResult.is_correct ? styles.fbCorrect : styles.fbIncorrect]}>
                {lastResult.is_correct ? (
                  <>
                    <Text style={styles.feedbackIcon}>✅</Text>
                    <Text style={styles.feedbackText}>Correct! +{lastResult.points} pts</Text>
                  </>
                ) : selectedAnswer === null ? (
                  <>
                    <Text style={styles.feedbackIcon}>⏱️</Text>
                    <Text style={styles.feedbackText}>Time's up!</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.feedbackIcon}>❌</Text>
                    <Text style={styles.feedbackText}>Incorrect</Text>
                  </>
                )}
              </View>
            ) : null}
          </ScrollView>
        ) : null}

        {phase === PHASE.SUMMARY ? (
          <ScrollView contentContainerStyle={styles.summaryWrap}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {summary?.level_up ? '🎉 Level Up!' : '🏁 Session Complete!'}
              </Text>

              {summary?.level_up ? (
                <View style={styles.levelUpBanner}>
                  <Text style={styles.levelUpText}>Level {summary.new_level_unlocked} Unlocked!</Text>
                </View>
              ) : null}

              <View style={styles.summaryStatsGrid}>
                <View style={styles.summaryStat}><Text style={styles.summaryVal}>{summary?.session?.score ?? score}</Text><Text style={styles.summaryLbl}>Score</Text></View>
                <View style={styles.summaryStat}><Text style={styles.summaryVal}>{summary?.session_accuracy ?? 0}%</Text><Text style={styles.summaryLbl}>Accuracy</Text></View>
                <View style={styles.summaryStat}><Text style={[styles.summaryVal, styles.coinsSummaryVal]}>🪙 +{summary?.coins_earned ?? 0}</Text><Text style={styles.summaryLbl}>Coins Earned</Text></View>
                <View style={styles.summaryStat}><Text style={styles.summaryVal}>🔥 {summary?.session?.max_streak ?? maxStreak}</Text><Text style={styles.summaryLbl}>Best Streak</Text></View>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownCorrect}>✅ {correctCount} correct</Text>
                <Text style={styles.breakdownWrong}>❌ {wrongCount} wrong</Text>
                <Text style={styles.breakdownTotal}>out of {questions.length}</Text>
              </View>

              {summary?.badges_awarded?.length > 0 ? (
                <View style={styles.badgesBox}>
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#eff6ff',
    marginRight: 10,
  },
  sidebarToggleText: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '700',
  },
  logoMini: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingCard: {
    minWidth: 200,
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
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 20,
  },
  coinsPill: {
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  coinsPillText: {
    color: '#b45309',
    fontWeight: '700',
    fontSize: 13,
  },
  errorBanner: {
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
  errorBannerText: {
    flex: 1,
    color: '#fca5a5',
    fontWeight: '600',
    fontSize: 12,
  },
  dismissBtn: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissBtnText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '700',
  },
  menuScroll: {
    padding: 16,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 20,
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroVisual: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  subscribePrompt: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  subscribeIcon: {
    fontSize: 34,
    marginBottom: 6,
  },
  subscribeTitle: {
    color: '#b45309',
    fontSize: 18,
    fontWeight: '700',
  },
  subscribeText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
  },
  subscribeBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
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
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  statCard: {
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statVal: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '800',
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
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  levelsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  levelBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  levelBtnLocked: {
    opacity: 0.35,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  levelBtnGated: {
    opacity: 0.5,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
  },
  levelBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },
  playBtn: {
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: '#f87171',
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
    color: '#3b82f6',
  },
  gameArea: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    padding: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  qCounter: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: '#3b82f6',
  },
  levelBadge: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 8,
  },
  timerBar: {
    marginBottom: 12,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  timerFill: {
    height: '100%',
  },
  timerText: {
    position: 'absolute',
    right: 8,
    top: -18,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  hudRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  hudItem: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  hudLabel: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 2,
  },
  hudValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  scoreValue: {
    color: '#2563eb',
  },
  streakHot: {
    color: '#f59e0b',
  },
  streakBonus: {
    marginTop: 4,
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  staffWrap: {
    marginBottom: 10,
    alignItems: 'center',
  },
  prompt: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  choicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  choiceBtn: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 20,
  },
  choiceCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  choiceIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  choiceDisabled: {
    opacity: 0.72,
  },
  choiceTextActive: {
    color: '#ffffff',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  fbCorrect: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  fbIncorrect: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  feedbackIcon: {
    fontSize: 18,
  },
  feedbackText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryWrap: {
    padding: 20,
    alignItems: 'center',
  },
  summaryCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 20,
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
    textAlign: 'center',
  },
  levelUpBanner: {
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 14,
  },
  levelUpText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  summaryStatsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  summaryStat: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryVal: {
    color: '#2563eb',
    fontSize: 22,
    fontWeight: '800',
  },
  coinsSummaryVal: {
    color: '#f59e0b',
  },
  summaryLbl: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  breakdownCorrect: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 13,
  },
  breakdownWrong: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  breakdownTotal: {
    color: '#64748b',
    fontSize: 13,
  },
  badgesBox: {
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
    fontWeight: '700',
    fontSize: 15,
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
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  secondaryBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NoteNinjaGame;
