import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useStudent } from '../contexts/StudentContext';
import { apiClient } from '../api';

export const FocusModePage: React.FC = () => {
  const { studentId, state, loading, refreshState } = useStudent();
  const [quizScore, setQuizScore] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Focus timer logic
  useEffect(() => {
    if (isTimerRunning && timerStartTime) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000 / 60);
        setFocusMinutes(elapsed);
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [isTimerRunning, timerStartTime]);

  // Tab visibility detection for cheater detection
  useEffect(() => {
    if (!isTimerRunning) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        // Tab switched - auto-fail
        if (window.confirm('You switched tabs. Focus timer will be stopped and submitted with a fail. Continue?')) {
          setIsTimerRunning(false);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          // Auto-submit with fail
          const submitFail = async () => {
            if (!studentId) return;
            try {
              await apiClient.dailyCheckin({
                student_id: studentId,
                quiz_score: 0,
                focus_minutes: focusMinutes,
              });
              await refreshState();
              window.alert('Focus timer stopped due to tab switch. Check-in submitted with fail.');
            } catch (error: any) {
              window.alert('Error: ' + (error.message || 'Failed to submit check-in'));
            }
          };
          submitFail();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTimerRunning, studentId, focusMinutes, refreshState]);

  const handleStartTimer = () => {
    if (!studentId || state?.status === 'Locked' || state?.status === 'Remedial') {
      window.alert('Cannot Start Timer: Please complete your intervention task first.');
      return;
    }

    setIsTimerRunning(true);
    const start = Date.now();
    setTimerStartTime(start);
    startTimeRef.current = start;
    setFocusMinutes(0);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleSubmit = async (autoFail: boolean = false) => {
    if (!studentId) {
      window.alert('Error: Student ID not set');
      return;
    }

    const score = autoFail ? 0 : parseInt(quizScore, 10);
    if (!autoFail && (isNaN(score) || score < 0 || score > 10)) {
      window.alert('Invalid Input: Quiz score must be between 0 and 10');
      return;
    }

    setSubmitting(true);
    try {
      handleStopTimer();
      
      const response = await apiClient.dailyCheckin({
        student_id: studentId,
        quiz_score: score,
        focus_minutes: focusMinutes,
      });

      // Refresh state after submission
      await refreshState();

      if (response.status === 'Pending Mentor Review') {
        window.alert('Check-in Submitted: Your mentor will review your performance and assign a task if needed.');
      } else {
        window.alert('Check-in Submitted: Great job! You\'re on track.');
      }

      // Reset form
      setQuizScore('');
      setFocusMinutes(0);
      setIsTimerRunning(false);
      setTimerStartTime(null);
    } catch (error: any) {
      window.alert('Error: ' + (error.message || 'Failed to submit check-in'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!studentId || !state?.active_intervention) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.markComplete({
        student_id: studentId,
        intervention_id: state.active_intervention.id,
      });

      await refreshState();
      window.alert('Success: Task marked complete! You\'re back on track.');
    } catch (error: any) {
      window.alert('Error: ' + (error.message || 'Failed to mark task complete'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!studentId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please login first</Text>
      </View>
    );
  }

  // Locked State
  if (state?.status === 'Locked' || state?.status === 'Needs Intervention') {
    return (
      <View style={[styles.container, styles.lockedContainer]}>
        <Text style={styles.lockedIcon}>🔒</Text>
        <Text style={styles.lockedTitle}>Analysis in Progress</Text>
        <Text style={styles.lockedSubtitle}>Waiting for Mentor Review...</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Status: {state.status}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshState}>
          <Text style={styles.refreshButtonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Remedial State
  if (state?.status === 'Remedial' && state.active_intervention) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Intervention Task</Text>
          <View style={[styles.statusBadge, styles.remedialBadge]}>
            <Text style={styles.statusText}>Remedial</Text>
          </View>
        </View>

        <View style={styles.taskCard}>
          <Text style={styles.taskLabel}>Assigned Task:</Text>
          <Text style={styles.taskText}>{state.active_intervention.task}</Text>
          <Text style={styles.taskStatus}>Status: {state.active_intervention.status}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.completeButton]}
          onPress={handleMarkComplete}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Mark Complete</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Normal State
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Check-in</Text>
        <View style={[styles.statusBadge, styles.onTrackBadge]}>
          <Text style={styles.statusText}>{state?.status || 'On Track'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Focus Timer</Text>
        <Text style={styles.timerDisplay}>{focusMinutes} minutes</Text>
        
        {!isTimerRunning ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartTimer}
            disabled={state?.status === 'Locked' || state?.status === 'Remedial'}
          >
            <Text style={styles.buttonText}>Start Focus Timer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopTimer}
          >
            <Text style={styles.buttonText}>Stop Timer</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Quiz Score</Text>
        <Text style={styles.inputLabel}>Enter your quiz score (0-10)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={quizScore}
            onChangeText={setQuizScore}
            placeholder="0-10"
            keyboardType="numeric"
            maxLength={2}
            editable={state?.status !== 'Locked' && state?.status !== 'Remedial'}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.submitButton]}
        onPress={() => handleSubmit(false)}
        disabled={submitting || !quizScore || state?.status === 'Locked' || state?.status === 'Remedial'}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Check-in</Text>
        )}
      </TouchableOpacity>

      {state?.status && (
        <Text style={styles.lastUpdated}>
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginVertical: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginTop: 20,
  },
  completeButton: {
    backgroundColor: '#34C759',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  onTrackBadge: {
    backgroundColor: '#D4EDDA',
  },
  remedialBadge: {
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lockedContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  lockedSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  taskStatus: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 20,
  },
});

