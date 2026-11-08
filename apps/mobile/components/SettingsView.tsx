import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  LogOut,
  Check,
  Upload,
  X,
  ExternalLink,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography } from '@krpkg/ui';
import { loginOperator, uploadProfileMedia, updateHeroAndTheme } from '../lib/api';

interface SettingsViewProps {
  endpoint: string;
  onUpdateEndpoint: (newEndpoint: string) => void;
  token: string | null;
  operatorUser: string | null;
  currentBannerUrl?: string | null;
  currentTheme?: string;
  onLoginSuccess: (token: string, username: string) => void;
  onLogout: () => void;
  onSettingsSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  endpoint,
  onUpdateEndpoint,
  token,
  operatorUser,
  currentBannerUrl = null,
  currentTheme = 'default',
  onLoginSuccess,
  onLogout,
  onSettingsSaved,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkin, setSelectedSkin] = useState<'default' | 'citlali' | 'furina'>(
    (currentTheme as any) || 'default'
  );
  const [heroUrl, setHeroUrl] = useState(currentBannerUrl || '');
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('// status: awaiting credentials');
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);

  useEffect(() => {
    if (currentBannerUrl !== undefined) {
      setHeroUrl(currentBannerUrl || '');
    }
  }, [currentBannerUrl]);

  useEffect(() => {
    if (currentTheme) {
      setSelectedSkin((['default', 'citlali', 'furina'].includes(currentTheme) ? currentTheme : 'default') as any);
    }
  }, [currentTheme]);

  const handlePickHeroImage = async () => {
    if (!token) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setUploadingHero(true);
        setSettingsStatus('Uploading hero image to R2...');
        const uploadRes = await uploadProfileMedia(endpoint, token, res.assets[0].uri, 'banner');
        if (uploadRes.success && uploadRes.url) {
          setHeroUrl(uploadRes.url);
          setSettingsStatus('// Hero image uploaded to Cloudflare R2!');
        } else {
          setSettingsStatus(`// Upload failed: ${uploadRes.error || 'Server error'}`);
        }
      }
    } catch (err: any) {
      setSettingsStatus(`// Error: ${err?.message || 'Failed to select image'}`);
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!token) return;
    setSavingSettings(true);
    setSettingsStatus('Saving preferences...');

    const res = await updateHeroAndTheme(
      endpoint,
      token,
      heroUrl.trim() || null,
      selectedSkin
    );

    if (res.success) {
      setSettingsStatus('// Hero image & site skin saved!');
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } else {
      setSettingsStatus(`// Error: ${res.error || 'Failed to save'}`);
    }
    setSavingSettings(false);
  };

  const handleOperatorLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Operator identifier and passphrase are required');
      return;
    }
    setLoading(true);
    setError(null);
    setStatusMsg('// status: handshaking with auth server...');

    try {
      const res = await loginOperator(endpoint, identifier.trim(), password.trim());
      if (res.success && res.token) {
        setStatusMsg('// status: verified. loading settings...');
        onLoginSuccess(res.token, res.username || identifier.trim());
        setPassword('');
        setIdentifier('');
      } else {
        setStatusMsg('// status: error — access denied');
        setError(res.error || 'Access denied');
      }
    } catch (err: any) {
      setStatusMsg('// status: network error during handshake');
      setError(err?.message || 'Network error during handshake');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 1:1 Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>
          <Text style={{ color: colors.accent }}>preferences</Text> &amp; settings
        </Text>
        <Text style={styles.headerSub}>
          <Text style={{ color: colors.accent }}>設定</Text> —{' '}
          {token ? 'operator controls & content preferences' : 'operator login'}
        </Text>
      </View>

      {token ? (
        /* 1:1 Logged-in Operator Settings Card */
        <View style={styles.bracketCard}>
          {/* Site Skin Panel */}
          <View style={styles.innerPanel}>
            <Text style={styles.panelTag}>// SITE SKIN</Text>
            <Text style={styles.panelDesc}>
              Change the atmosphere of the entire site. This control is only available to the operator.
            </Text>

            <View style={styles.skinBtnRow}>
              {(['default', 'citlali', 'furina'] as const).map((skin) => (
                <TouchableOpacity
                  key={skin}
                  style={[styles.skinBtn, selectedSkin === skin && styles.skinBtnActive]}
                  onPress={() => setSelectedSkin(skin)}
                >
                  <Text style={[styles.skinBtnText, selectedSkin === skin && styles.skinBtnTextActive]}>
                    {skin}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.themeStatus}>// current skin: {selectedSkin}</Text>
          </View>

          {/* Hero Banner Header & Controls */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.panelTag}>// HERO IMAGE</Text>
            <Text style={styles.operatorUserTag}>@{operatorUser || 'operator'}</Text>
          </View>

          {/* Hero Preview Card */}
          <View style={styles.heroPreviewWrap}>
            {heroUrl ? (
              <Image source={{ uri: heroUrl }} style={styles.heroPreviewImg} resizeMode="cover" />
            ) : (
              <View style={styles.heroPreviewPlaceholder}>
                <Text style={styles.heroPlaceholderText}>NO HERO IMAGE</Text>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>IMAGE URL</Text>
            <TextInput
              style={styles.textInput}
              value={heroUrl}
              onChangeText={setHeroUrl}
              placeholder="https://... or upload below"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={handlePickHeroImage}
              disabled={uploadingHero}
            >
              {uploadingHero ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Upload size={12} color={colors.accent} />
                  <Text style={styles.heroActionBtnText}>UPLOAD</Text>
                </>
              )}
            </TouchableOpacity>

            {heroUrl ? (
              <TouchableOpacity
                style={styles.heroActionBtn}
                onPress={() => setHeroUrl('')}
              >
                <X size={12} color={colors.textDim} />
                <Text style={[styles.heroActionBtnText, { color: colors.textDim }]}>CLEAR</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.saveHeroBtn}
              onPress={handleSavePreferences}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color="#0a0a0c" />
              ) : (
                <>
                  <Check size={12} color="#0a0a0c" />
                  <Text style={styles.saveHeroBtnText}>SAVE →</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {settingsStatus ? (
            <Text style={styles.settingsStatusMsg}>{settingsStatus}</Text>
          ) : null}

          {/* Logout Action Row */}
          <View style={styles.logoutRow}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <LogOut size={12} color={colors.textDim} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* 1:1 Logged-out Login Card */
        <View style={styles.bracketCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.panelTag}>// LOGIN • CLOUDFLARE D1</Text>
          </View>
          <Text style={styles.loginCardTitle}>Log in to unlock settings</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>OPERATOR IDENTIFIER (EMAIL OR HANDLE)</Text>
            <TextInput
              style={styles.textInput}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder=""
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>SECURITY PASSPHRASE</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••••••"
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.statusText}>{statusMsg}</Text>

          <TouchableOpacity
            style={[styles.postBtn, loading && styles.btnDisabled]}
            onPress={handleOperatorLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0c" size="small" />
            ) : (
              <Text style={styles.postBtnText}>VERIFY CREDENTIALS →</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 40,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
  },
  pageHeader: {
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: typography.fontMono,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  headerSub: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 4,
  },
  bracketCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#2a2a30',
    borderRadius: 4,
    padding: 24,
    gap: 16,
  },
  innerPanel: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 4,
    padding: 16,
    gap: 10,
  },
  panelTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 2,
  },
  panelDesc: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: '#706c66',
    lineHeight: 16,
  },
  skinBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skinBtn: {
    flex: 1,
    backgroundColor: '#18181c',
    borderWidth: 1,
    borderColor: '#2a2a30',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 2,
  },
  skinBtnActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(196, 147, 104, 0.12)',
  },
  skinBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: '#b0aca4',
  },
  skinBtnTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  themeStatus: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#4a4844',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operatorUserTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#706c66',
  },
  loginCardTitle: {
    fontFamily: typography.fontMono,
    fontSize: 16,
    color: '#e2ded6',
    fontWeight: '400',
    marginTop: -4,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#4a4844',
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 2,
    color: '#e2ded6',
    fontFamily: typography.fontMono,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: '#4a4844',
  },
  errorText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: '#e06c75',
  },
  postBtn: {
    backgroundColor: colors.accent,
    borderRadius: 2,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  postBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a0a0c',
    letterSpacing: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  logoutRow: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a30',
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  heroPreviewWrap: {
    height: 120,
    borderWidth: 1,
    borderColor: '#2a2a30',
    borderRadius: 3,
    backgroundColor: '#0a0a0c',
    overflow: 'hidden',
  },
  heroPreviewImg: {
    width: '100%',
    height: '100%',
  },
  heroPreviewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: '#706c66',
    letterSpacing: 1,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#18181c',
    borderWidth: 1,
    borderColor: '#2a2a30',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 2,
  },
  heroActionBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  saveHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 2,
    marginLeft: 'auto',
  },
  saveHeroBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0a0a0c',
    letterSpacing: 0.5,
  },
  settingsStatusMsg: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181c',
    borderWidth: 1,
    borderColor: '#2a2a30',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 2,
  },
  logoutText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: '#b0aca4',
  },
});
