import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { apiClient, StudentState } from '../api';

interface StudentContextType {
  studentId: string | null;
  state: StudentState | null;
  loading: boolean;
  error: string | null;
  setStudentId: (id: string) => void;
  refreshState: () => Promise<void>;
  socket: Socket | null;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentId, setStudentIdState] = useState<string | null>(null);
  const [state, setState] = useState<StudentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const setStudentId = (id: string) => {
    setStudentIdState(id);
    // Load state when student ID is set
    if (id) {
      refreshState();
    }
  };

  const refreshState = async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);
    try {
      const studentState = await apiClient.getStudentState(studentId);
      setState(studentState);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student state');
      console.error('Error fetching student state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!studentId) return;

    const newSocket = io(config.wsUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      // Subscribe to student updates
      newSocket.emit('subscribe_student', studentId);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    newSocket.on('student_status_changed', (data: StudentState) => {
      console.log('Student status changed:', data);
      setState(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe_student', studentId);
      newSocket.disconnect();
    };
  }, [studentId]);

  // Initial state fetch
  useEffect(() => {
    if (studentId) {
      refreshState();
    }
  }, [studentId]);

  return (
    <StudentContext.Provider
      value={{
        studentId,
        state,
        loading,
        error,
        setStudentId,
        refreshState,
        socket,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

