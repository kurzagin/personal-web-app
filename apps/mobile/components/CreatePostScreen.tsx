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
  Alert,
} from 'react-native';
import { ArrowLeft, Send, Paperclip, X, Radio, Terminal } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '@krpkg/ui';
import { createPost, uploadPostImage, type UploadedMediaItem } from '../lib/api';

interface CreatePostScreenProps {
  endpoint: string;
  token: string;
  onPostCreated: () => void;
  onBack: () => void;
}

interface StagedImage {
  uri: string;
  fileName?: string;
}

const QUICK_TAGS = ['#note', '#dev', '#media', '#anime', '#music', '#life'];

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  endpoint,
  token,
  onPostCreated,
  onBack,
}) => {
  const [content, setContent] = useState('');
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Camera roll permission is needed to attach images to your broadcast.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 8 - stagedImages.length,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages: StagedImage[] = result.assets.map((asset) => ({
          uri: asset.uri,
          fileName: asset.fileName || undefined,
        }));
        setStagedImages((prev) => [...prev, ...newImages].slice(0, 8));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to select image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setStagedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInsertTag = (tag: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${tag} ` : `${tag} `;
    });
  };

  const handleSubmit = async () => {
    if ((!content.trim() && stagedImages.length === 0) || loading) return;

    setLoading(true);
    setError(null);

    try {
      const uploadedMedia: UploadedMediaItem[] = [];

      // Upload staged images to AVIF via /api/media/upload-post-image (1:1 with Web)
      for (let i = 0; i < stagedImages.length; i++) {
        const item = stagedImages[i];
        setUploadStatusText(`UPLOADING AVIF (${i + 1}/${stagedImages.length})...`);

        const uploadRes = await uploadPostImage(endpoint, token, item.uri, item.fileName);
        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(uploadRes.error || `Failed to upload image ${i + 1}`);
        }

        uploadedMedia.push({
          url: uploadRes.url,
          category: 'media',
          media_type: 'image',
          width: uploadRes.width,
          height: uploadRes.height,
        });
      }

      setUploadStatusText('BROADCASTING LOG...');
      const res = await createPost(endpoint, token, content.trim(), uploadedMedia);

      if (res.success) {
        setContent('');
        setStagedImages([]);
        onPostCreated();
        onBack();
      } else {
        setError(res.error || 'Failed to transmit broadcast');
      }
    } catch (err: any) {
      setError(err?.message || 'Broadcast transmission error');
    } finally {
      setLoading(false);
      setUploadStatusText(null);
    }
  };

  const canSubmit = (content.trim().length > 0 || stagedImages.length > 0) && !loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={16} color={colors.accent} />
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>NEW TRANSMISSION</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Console Header (Anime console style) */}
        <View style={styles.card}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <View style={styles.sectionHead}>
            <Terminal size={15} color={colors.accent} />
            <Text style={styles.sectionTitle}>TRANSMISSION CONSOLE</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Broadcast a new personal transmission or dispatch to the live feed. Supports Markdown styling, inline #tags, and AVIF media uploads.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>[ERR] {error}</Text>
            </View>
          )}

          {/* Quick Tag Pills (Matching anime filter/status badges) */}
          <View style={styles.tagPillContainer}>
            <Text style={styles.tagLabel}>QUICK TAGS:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagPillsList}>
              {QUICK_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagPill}
                  onPress={() => handleInsertTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagPillText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Main Composer Staged Bracket Card */}
        <View style={styles.stagingCard}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <View style={styles.stagingHeader}>
            <View style={styles.operatorRow}>
              <View style={styles.livePulse} />
              <Text style={styles.stagingTitle}>// LOG DISPATCH DRAFT</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={[styles.counterText, content.length > 4500 && styles.counterTextWarn]}>
                {content.length} / 5000
              </Text>
            </View>
          </View>

          {/* Textarea */}
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="broadcast new transmission to kurzagin... (supports #tags)"
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={5000}
          />

          {/* Staged Media Previews (1:1 with Web media-preview-grid) */}
          {stagedImages.length > 0 && (
            <View style={styles.previewGrid}>
              {stagedImages.map((img, idx) => (
                <View key={idx} style={styles.previewItem}>
                  <Image source={{ uri: img.uri }} style={styles.previewThumb} />
                  <View style={styles.avifBadge}>
                    <Text style={styles.avifBadgeText}>AVIF</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveImage(idx)}
                    activeOpacity={0.8}
                  >
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.formDivider} />

          {/* Composer Footer Actions Toolbar */}
          <View style={styles.composerFooter}>
            <TouchableOpacity
              style={[
                styles.attachBtn,
                stagedImages.length >= 8 && styles.attachBtnDisabled,
              ]}
              onPress={handlePickImages}
              disabled={stagedImages.length >= 8 || loading}
              activeOpacity={0.7}
            >
              <Paperclip size={16} color={stagedImages.length >= 8 ? colors.textDim : colors.accent} />
              <Text
                style={[
                  styles.attachText,
                  stagedImages.length >= 8 && { color: colors.textDim },
                ]}
              >
                {stagedImages.length > 0 ? `ATTACHED (${stagedImages.length}/8)` : 'ATTACH AVIF MEDIA'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerHintBox}>
              <Radio size={12} color={colors.accent} />
              <Text style={styles.footerHintText}>FEED LOG</Text>
            </View>
          </View>
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
              <Text style={styles.submitBtnText}>
                {uploadStatusText || 'BROADCASTING...'}
              </Text>
            </View>
          ) : (
            <View style={styles.submitBtnInner}>
              <Send size={15} color="#0a0a0c" />
              <Text style={styles.submitBtnText}>BROADCAST LOG →</Text>
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
    gap: 10,
  },
  stagingCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 16,
    borderRadius: 4,
    position: 'relative',
    gap: 12,
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
    marginBottom: 2,
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
  },
  tagPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1c1c22',
  },
  tagLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  tagPillsList: {
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#2a2a32',
  },
  tagPillText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    padding: 10,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: typography.fontMono,
    color: colors.danger,
    fontSize: 11,
  },
  stagingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  stagingTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  counterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: '#2e2e38',
  },
  counterText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  counterTextWarn: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    padding: 12,
    fontFamily: typography.fontMono,
    fontSize: 13,
    color: colors.text,
    minHeight: 140,
    lineHeight: 18,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  previewItem: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1a1a20',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  avifBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  avifBadgeText: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.accent,
    fontWeight: 'bold',
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 4,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  attachBtnDisabled: {
    opacity: 0.5,
  },
  attachText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    fontWeight: 'bold',
  },
  footerHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(224, 169, 109, 0.1)',
  },
  footerHintText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
