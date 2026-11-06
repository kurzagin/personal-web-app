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
import { ArrowLeft, Send, Paperclip, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '@kurzagin/ui';
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
          <ArrowLeft size={18} color={colors.accent} />
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>NEW TRANSMISSION</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Composer Bracket Card */}
        <View style={styles.card}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <Text style={styles.sectionHeader}>// TRANSMISSION CONSOLE — NEW LOG</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>[ERR] {error}</Text>
            </View>
          )}

          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="broadcast new transmission to kurzagin... (supports #tags)"
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={8}
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

          {/* Composer Footer toolbar (1:1 with Web) */}
          <View style={styles.composerFooter}>
            <View style={styles.footerLeft}>
              <TouchableOpacity
                style={[
                  styles.attachBtn,
                  stagedImages.length >= 8 && styles.attachBtnDisabled,
                ]}
                onPress={handlePickImages}
                disabled={stagedImages.length >= 8 || loading}
                activeOpacity={0.7}
              >
                <Paperclip size={18} color={stagedImages.length >= 8 ? colors.textDim : colors.accent} />
                <Text
                  style={[
                    styles.attachText,
                    stagedImages.length >= 8 && { color: colors.textDim },
                  ]}
                >
                  {stagedImages.length > 0 ? `ATTACHED (${stagedImages.length}/8)` : 'ATTACH MEDIA'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.charCount}>{content.length} / 5000</Text>
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
  sectionHeader: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    padding: 10,
  },
  errorText: {
    fontFamily: typography.fontMono,
    color: colors.danger,
    fontSize: 11,
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
    minHeight: 160,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  previewItem: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1c1c22',
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
    backgroundColor: 'rgba(10, 10, 12, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: colors.accent,
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
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1c1c22',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: '#2e2e38',
  },
  attachBtnDisabled: {
    opacity: 0.5,
  },
  attachText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  charCount: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
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
