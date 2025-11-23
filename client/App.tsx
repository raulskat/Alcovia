import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StudentProvider } from './src/contexts/StudentContext';
import { LoginPage } from './src/pages/LoginPage';
import { FocusModePage } from './src/pages/FocusModePage';
import { StyleSheet, View, Text } from 'react-native';

export default function App() {
  return (
    <StudentProvider>
      <Router>
        <View style={styles.container}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/focus" element={<FocusModePage />} />
          </Routes>
        </View>
      </Router>
    </StudentProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

