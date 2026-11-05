import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '@kurzagin/ui';

interface AdminLoginProps {
  onLoginSuccess: (token: string, apiEndpoint: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [endpoint, setEndpoint] = useState('https://kurzagin.com');
  const [username, setUsername] = useState('kurzagin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const formattedEndpoint = endpoint.replace(/\/$/, '');
      const res = await fetch(`${formattedEndpoint}/api/auth/operator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.token) {
        throw new Error(data?.error || `Authentication failed (${res.status})`);
      }

      onLoginSuccess(data.token, formattedEndpoint);
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OPERATOR AUTHENTICATION</Text>
      <Text style={styles.subtitle}>Secure D1 / Database Login</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>SERVER ENDPOINT</Text>
      <TextInput
        style={styles.input}
        value={endpoint}
        onChangeText={setEndpoint}
        placeholder="https://kurzagin.com"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
      />

      <Text style={styles.label}>OPERATOR USERNAME</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="kurzagin"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
      />

      <Text style={styles.label}>SECURITY PASSPHRASE</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        placeholderTextColor={colors.textDim}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.buttonText}>LOGIN &amp; RECEIVE SESSION TOKEN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.xl,
    margin: spacing.lg,
  },
  title: {
    fontFamily: typography.fontMono,
    color: colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontFamily: typography.fontMono,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.fontMono,
    color: colors.textDim,
    fontSize: 10,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    color: colors.text,
    fontFamily: typography.fontMono,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.bg,
    fontFamily: typography.fontMono,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontMono,
    fontSize: 12,
    marginBottom: spacing.md,
  },
});
