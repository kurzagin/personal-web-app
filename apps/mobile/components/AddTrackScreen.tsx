import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Disc3,
  Music2,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X,
  FileAudio,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '@kurzagin/ui';
import {
  addTrack,
  presignAudioUpload,
  uploadAudioToPresignedUrl,
  uploadCoverImage,
} from '../lib/api';

interface AddTrackScreenProps {
  endpoint: string;
  token: string;
  onTrackAdded: () => void;
  onBack: () => void;
}

interface SelectedAudio {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export const AddTrackScreen: React.FC<AddTrackScreenProps> = ({
  endpoint,
  token,
  onTrackAdded,
  onBack,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState('3:45');

  // Local file attachments
  const [selectedAudio, setSelectedAudio] = useState<SelectedAudio | null>(null);
  const [selectedCoverUri, setSelectedCoverUri] = useState<string | null>(null);

  // Manual fallback URL inputs
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  const [directAudioUrl, setDirectAudioUrl] = useState('');
  const [directCoverUrl, setDirectCoverUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pick audio file (.opus, .mp3, .ogg, .m4a, audio/*)
  const handlePickAudio = async () => {
    try {
      setError(null);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/ogg', 'audio/opus', 'audio/mpeg', 'audio/mp4'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setSelectedAudio({
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType || 'audio/ogg; codecs=opus',
        });

        // Auto-fill track title if blank from file name
        if (!title.trim() && file.name) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(cleanName);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to select audio file');
    }
  };

  // Pick cover art from library
  const handlePickCover = async () => {
    try {
      setError(null);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedCoverUri(res.assets[0].uri);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to select cover artwork');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !artist.trim() || loading) {
      setError('Title and artist are required.');
      return;
    }

    if (!useDirectUrl && !selectedAudio) {
      setError('Please select an audio file to upload or switch to direct URL mode.');
      return;
    }

    if (useDirectUrl && !directAudioUrl.trim()) {
      setError('Audio stream URL is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalAudioUrl = directAudioUrl.trim();
      let finalCoverUrl = directCoverUrl.trim() || null;

      // 1. Upload Cover Art (if selected locally)
      if (!useDirectUrl && selectedCoverUri) {
        setStatusText('// UPLOADING ALBUM COVER ART...');
        const coverRes = await uploadCoverImage(endpoint, token, selectedCoverUri);
        if (!coverRes.success || !coverRes.url) {
          throw new Error(coverRes.error || 'Cover art upload failed');
        }
        finalCoverUrl = coverRes.url;
      }

      // 2. Upload Audio File (if selected locally)
      if (!useDirectUrl && selectedAudio) {
        setStatusText('// REQUESTING R2 PRESIGNED AUDIO TICKET...');
        const mime = selectedAudio.mimeType || 'audio/ogg; codecs=opus';
        const presign = await presignAudioUpload(endpoint, token, selectedAudio.name, mime);

        if (!presign.success || !presign.uploadUrl || !presign.publicUrl) {
          throw new Error(presign.error || 'Failed to obtain R2 upload ticket');
        }

        setStatusText('// STREAMING AUDIO TO CLOUDFLARE R2...');
        const uploadRes = await uploadAudioToPresignedUrl(
          presign.uploadUrl,
          selectedAudio.uri,
          presign.contentType || mime
        );

        if (!uploadRes.success) {
          throw new Error(uploadRes.error || 'Failed to stream audio file to R2');
        }

        finalAudioUrl = presign.publicUrl;
      }

      // 3. Register Record in Database
      setStatusText('// COMMITTING RECORD TO CRATE...');
      let durationSec = 0;
      if (duration.includes(':')) {
        const parts = duration.split(':');
        durationSec = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      } else {
        durationSec = parseInt(duration, 10) || 0;
      }

      const res = await addTrack(endpoint, token, {
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || null,
        audio_url: finalAudioUrl,
        cover_url: finalCoverUrl,
        duration: duration.trim() || '0:00',
        duration_sec: durationSec,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to press vinyl track');
      }

      onTrackAdded();
      onBack();
    } catch (err: any) {
      setError(err?.message || 'Vinyl mastering error');
    } finally {
      setLoading(false);
      setStatusText(null);
    }
  };

  const hasAudio = useDirectUrl ? directAudioUrl.trim().length > 0 : !!selectedAudio;
  const canSubmit = title.trim().length > 0 && artist.trim().length > 0 && hasAudio && !loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.accent} />
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>PRESS VINYL TRACK</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <View style={styles.sectionHead}>
            <Disc3 size={15} color={colors.accent} />
            <Text style={styles.sectionTitle}>VINYL PRESSING CONSOLE</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Master and press a new record into your turntable crates. Audio streams directly to Cloudflare R2 just like on the web.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>[ERR] {error}</Text>
            </View>
          )}

          {/* Mode Switcher */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeTab, !useDirectUrl && styles.modeTabActive]}
              onPress={() => setUseDirectUrl(false)}
            >
              <Text style={[styles.modeTabText, !useDirectUrl && styles.modeTabTextActive]}>
                FILE UPLOAD (R2)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, useDirectUrl && styles.modeTabActive]}
              onPress={() => setUseDirectUrl(true)}
            >
              <Text style={[styles.modeTabText, useDirectUrl && styles.modeTabTextActive]}>
                DIRECT URL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Track Details */}
          <Text style={styles.inputLabel}>// TRACK TITLE *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Plastic Love (Nightfly Re-Cut)"
            placeholderTextColor={colors.textDim}
          />

          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>// ARTIST NAME *</Text>
          <TextInput
            style={styles.textInput}
            value={artist}
            onChangeText={setArtist}
            placeholder="e.g. Mariya Takeuchi"
            placeholderTextColor={colors.textDim}
          />

          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>// ALBUM / RELEASE (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            value={album}
            onChangeText={setAlbum}
            placeholder="e.g. Variety (1984)"
            placeholderTextColor={colors.textDim}
          />

          {/* Audio Upload vs Direct URL */}
          {!useDirectUrl ? (
            <>
              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                // AUDIO FILE (.OPUS / .MP3 / .OGG) *
              </Text>
              {selectedAudio ? (
                <View style={styles.fileSelectedBox}>
                  <FileAudio size={20} color={colors.accent} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {selectedAudio.name}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {selectedAudio.size ? `${(selectedAudio.size / (1024 * 1024)).toFixed(2)} MB • ` : ''}
                      READY TO STREAM TO R2
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedAudio(null)}
                    style={styles.removeFileBtn}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dropzone}
                  onPress={handlePickAudio}
                  activeOpacity={0.7}
                >
                  <Upload size={20} color={colors.accent} />
                  <Text style={styles.dropzoneText}>SELECT AUDIO FILE</Text>
                  <Text style={styles.dropzoneSub}>TAP TO BROWSE DEVICE AUDIO</Text>
                </TouchableOpacity>
              )}

              {/* Cover Art Upload */}
              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                // COVER ARTWORK (OPTIONAL)
              </Text>
              {selectedCoverUri ? (
                <View style={styles.coverSelectedBox}>
                  <Image source={{ uri: selectedCoverUri }} style={styles.coverThumb} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>Cover Artwork Selected</Text>
                    <Text style={styles.fileMeta}>Will convert to square AVIF</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedCoverUri(null)}
                    style={styles.removeFileBtn}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dropzone}
                  onPress={handlePickCover}
                  activeOpacity={0.7}
                >
                  <ImageIcon size={20} color={colors.accent} />
                  <Text style={styles.dropzoneText}>SELECT COVER IMAGE</Text>
                  <Text style={styles.dropzoneSub}>SQUARE ALBUM ART (JPG/PNG)</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                // AUDIO STREAM URL (MP3/OPUS) *
              </Text>
              <TextInput
                style={styles.textInput}
                value={directAudioUrl}
                onChangeText={setDirectAudioUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                // COVER ARTWORK URL (OPTIONAL)
              </Text>
              <TextInput
                style={styles.textInput}
                value={directCoverUrl}
                onChangeText={setDirectCoverUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>// DURATION (MM:SS)</Text>
          <TextInput
            style={styles.textInput}
            value={duration}
            onChangeText={setDuration}
            placeholder="3:45"
            placeholderTextColor={colors.textDim}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.submitBtnInner}>
              <ActivityIndicator size="small" color="#0a0a0c" />
              <Text style={styles.submitBtnText}>{statusText || 'PRESSING VINYL...'}</Text>
            </View>
          ) : (
            <View style={styles.submitBtnInner}>
              <CheckCircle2 size={16} color="#0a0a0c" />
              <Text style={styles.submitBtnText}>PRESS RECORD TO CRATE →</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#0e0e12',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(224, 169, 109, 0.1)',
  },
  backBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.accent,
    fontWeight: 'bold',
  },
  pageTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    borderRadius: 4,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: colors.accent,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 16,
    marginBottom: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
  },
  modeTabActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(224, 169, 109, 0.12)',
  },
  modeTabText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.8,
  },
  modeTabTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: typography.fontMono,
    color: colors.danger,
    fontSize: 11,
  },
  inputLabel: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fontMono,
    fontSize: 13,
    color: colors.text,
  },
  dropzone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3f3f46',
    backgroundColor: '#0a0a0c',
    borderRadius: 4,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dropzoneText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    fontWeight: 'bold',
  },
  dropzoneSub: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
  },
  fileSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 4,
    padding: 10,
    gap: 10,
  },
  coverSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 4,
    padding: 8,
    gap: 10,
  },
  coverThumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
    fontWeight: 'bold',
  },
  fileMeta: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  removeFileBtn: {
    backgroundColor: '#27272a',
    padding: 6,
    borderRadius: 4,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a0a0c',
    letterSpacing: 1,
  },
});
