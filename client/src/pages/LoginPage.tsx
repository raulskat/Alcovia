import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useStudent } from '../contexts/StudentContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [inputId, setInputId] = useState('');
  const { setStudentId } = useStudent();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (inputId.trim()) {
      setStudentId(inputId.trim());
      navigate('/focus');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Intervention Engine</Text>
      <Text style={styles.subtitle}>Student Login</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Student ID</Text>
        <TextInput
          style={styles.input}
          value={inputId}
          onChangeText={setInputId}
          placeholder="Enter your Student ID"
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.demo}>
        <Text style={styles.demoTitle}>Demo Students:</Text>
        <TouchableOpacity 
          style={styles.demoButton}
          onPress={() => {
            setStudentId('11111111-2222-3333-4444-555555555555');
            navigate('/focus');
          }}
        >
          <Text style={styles.demoButtonText}>Use Test Student</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  demo: {
    marginTop: 40,
    width: '100%',
    maxWidth: 400,
  },
  demoTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

