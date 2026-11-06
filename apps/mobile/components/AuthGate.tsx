import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing } from '@kurzagin/ui';

interface AuthGateProps {
  initialEndpoint: string;
  onAuthenticated: (token: string, endpoint: string, username: string) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  initialEndpoint,
  onAuthenticated,
}) => {
  const [endpoint, setEndpoint] = useState(initialEndpoint || 'https://kurzagin.com');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!endpoint.trim()) {
      setError('A valid backend server URL is required');
      return;
    }
    if (!username.trim() || !password.trim()) {
      setError('Operator username and passphrase are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanEndpoint = endpoint.trim().replace(/\/$/, '');
      const res = await fetch(`${cleanEndpoint}/api/auth/operator`, {
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
        throw new Error(data?.error || `Access denied (${res.status})`);
      }

      onAuthenticated(data.token, cleanEndpoint, data.user?.username || username.trim());
    } catch (err: any) {
      setError(err?.message || 'Connection failed. Verify endpoint and credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.systemBadge}>SECURITY CLEARANCE REQUIRED</Text>
          </View>

          <Text style={styles.title}>OPERATOR TERMINAL</Text>
          <Text style={styles.subtitle}>
            Enter target instance URL and operator credentials. No persistent API keys or tokens are stored in the client bundle.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>[ERR] {error}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>TARGET INSTANCE URL</Text>
            <TextInput
              style={styles.input}
              value={endpoint}
              onChangeText={setEndpoint}
              placeholder="https://kurzagin.com"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>Domain or LAN IP (e.g., https://kurzagin.com or http://192.168.1.10:3000)</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>OPERATOR USERNAME</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. kurzagin"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>SECURITY PASSPHRASE</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••••"
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <Text style={styles.buttonText}>AUTHENTICATE &amp; CONNECT &rarr;</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>// SECURE CLIENT-SIDE SESSION WITH D1 &middot; ZERO HARDBOUND SECRETS</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  systemBadge: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: typography.fontMono,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.danger,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.text,
    fontFamily: typography.fontMono,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  hint: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.bg,
    letterSpacing: 1,
  },
  footerNote: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.xl,
    letterSpacing: 0.8,
  },
});
