import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ExternalLink,
  Mail,
  ArrowRight,
  ArrowUpRight,
  Settings,
  Upload,
  Plus,
  Trash2,
  X,
  Check,
  Globe,
  Sparkles,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '@krpkg/ui';
import {
  type WebProfile,
  type ProjectEntry,
  type SocialLink,
  type ContactDetailEntry,
  updateProfile,
  uploadProfileMedia,
} from '../lib/api';

interface DossierViewProps {
  profile: WebProfile | null;
  endpoint: string;
  token?: string | null;
  operatorUser?: string | null;
  onProfileUpdated?: () => void;
  showEditControl?: boolean;
}

export const DossierView: React.FC<DossierViewProps> = ({
  profile,
  endpoint,
  token,
  operatorUser,
  onProfileUpdated,
  showEditControl = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [location, setLocation] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [techStackStr, setTechStackStr] = useState('');
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [contacts, setContacts] = useState<ContactDetailEntry[]>([]);

  const syncFromProfile = () => {
    if (!profile) return;
    setName(profile.name || '');
    setHandle(profile.handle || '');
    setLocation(profile.location || '');
    setStatusMessage(profile.status_message || '');
    setHeadline(profile.headline || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '');
    setBannerUrl(profile.banner_url || '');
    setContactEmail(profile.contact_email || '');
    setContactNote(profile.contact_note || '');
    setTechStackStr(Array.isArray(profile.tech_stack) ? profile.tech_stack.join(', ') : '');
    setProjects(profile.currently_building ? JSON.parse(JSON.stringify(profile.currently_building)) : []);
    setSocials(profile.social_links ? JSON.parse(JSON.stringify(profile.social_links)) : []);
    setContacts(profile.contact_details ? JSON.parse(JSON.stringify(profile.contact_details)) : []);
  };

  useEffect(() => {
    syncFromProfile();
  }, [profile]);

  const handleToggleEdit = () => {
    if (!isEditing) {
      syncFromProfile();
      setErrorMsg(null);
      setStatusMsg(null);
    }
    setIsEditing(!isEditing);
  };

  // Pick and upload avatar
  const handlePickAvatar = async () => {
    if (!token) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setUploadingAvatar(true);
        setErrorMsg(null);
        setStatusMsg('Optimizing avatar & uploading to Cloudflare R2...');

        const uploadRes = await uploadProfileMedia(endpoint, token, res.assets[0].uri, 'avatar');
        if (uploadRes.success && uploadRes.url) {
          setAvatarUrl(uploadRes.url);
          setStatusMsg('// Avatar transcoded to AVIF and uploaded!');
        } else {
          setErrorMsg(uploadRes.error || 'Failed to upload avatar');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error selecting avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Pick and upload banner
  const handlePickBanner = async () => {
    if (!token) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setUploadingBanner(true);
        setErrorMsg(null);
        setStatusMsg('Optimizing banner & uploading to Cloudflare R2...');

        const uploadRes = await uploadProfileMedia(endpoint, token, res.assets[0].uri, 'banner');
        if (uploadRes.success && uploadRes.url) {
          setBannerUrl(uploadRes.url);
          setStatusMsg('// Banner transcoded to AVIF and uploaded!');
        } else {
          setErrorMsg(uploadRes.error || 'Failed to upload banner');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error selecting banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Projects Repeater Helpers
  const addProject = () => {
    setProjects([
      ...projects,
      { title: '', description: '', url: '', badge: 'Active' },
    ]);
  };

  const updateProject = (idx: number, field: keyof ProjectEntry, value: string) => {
    const next = [...projects];
    next[idx] = { ...next[idx], [field]: value };
    setProjects(next);
  };

  const removeProject = (idx: number) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  // Social Links Repeater Helpers
  const addSocial = () => {
    setSocials([...socials, { platform: '', label: '', url: '' }]);
  };

  const updateSocial = (idx: number, field: keyof SocialLink, value: string) => {
    const next = [...socials];
    next[idx] = { ...next[idx], [field]: value };
    setSocials(next);
  };

  const removeSocial = (idx: number) => {
    setSocials(socials.filter((_, i) => i !== idx));
  };

  // Contact Details Repeater Helpers
  const addContact = () => {
    setContacts([...contacts, { method: '', value: '', link: '' }]);
  };

  const updateContact = (idx: number, field: keyof ContactDetailEntry, value: string) => {
    const next = [...contacts];
    next[idx] = { ...next[idx], [field]: value };
    setContacts(next);
  };

  const removeContact = (idx: number) => {
    setContacts(contacts.filter((_, i) => i !== idx));
  };

  // Save profile changes
  const handleSave = async () => {
    if (!name.trim() || !handle.trim()) {
      setErrorMsg('Operator name and handle are required.');
      return;
    }
    if (!token) {
      setErrorMsg('Unauthorized: Operator session required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setStatusMsg('Saving changes to database...');

    const tech_stack = techStackStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const currently_building = projects
      .map((p) => ({
        title: p.title.trim(),
        description: p.description.trim(),
        url: p.url ? p.url.trim() : undefined,
        badge: p.badge ? p.badge.trim() : 'Active',
      }))
      .filter((p) => p.title.length > 0);

    const social_links = socials
      .map((s) => ({
        platform: s.platform.trim(),
        label: s.label ? s.label.trim() : s.platform.trim(),
        url: s.url.trim(),
      }))
      .filter((s) => s.platform.length > 0 && s.url.length > 0);

    const contact_details = contacts
      .map((c) => ({
        method: c.method.trim(),
        value: c.value.trim(),
        link: c.link ? c.link.trim() : undefined,
      }))
      .filter((c) => c.method.length > 0 && c.value.length > 0);

    const payload: Partial<WebProfile> = {
      name: name.trim(),
      handle: handle.trim(),
      headline: headline.trim(),
      bio: bio.trim(),
      location: location.trim(),
      status_message: statusMessage.trim(),
      avatar_url: avatarUrl.trim() || undefined,
      banner_url: bannerUrl.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_note: contactNote.trim() || undefined,
      tech_stack,
      currently_building,
      social_links,
      contact_details,
    };

    const res = await updateProfile(endpoint, token, payload);
    setSaving(false);

    if (res.success) {
      setStatusMsg('// Profile saved successfully!');
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      setTimeout(() => {
        setIsEditing(false);
        setStatusMsg(null);
      }, 700);
    } else {
      setErrorMsg(res.error || 'Failed to update profile');
    }
  };

  const displayProjects = (profile?.currently_building || []) as ProjectEntry[];
  const displayTechStack = (profile?.tech_stack || []) as string[];
  const displaySocials = (profile?.social_links || []) as SocialLink[];
  const displayContacts = (profile?.contact_details || []) as ContactDetailEntry[];

  return (
    <View style={styles.container}>
      {/* Top Action Bar for Operator (Profile Page) */}
      {showEditControl && token && (
        <View style={styles.editorToolbar}>
          <TouchableOpacity
            style={[styles.toggleEditBtn, isEditing && styles.toggleEditBtnActive]}
            onPress={handleToggleEdit}
            activeOpacity={0.8}
          >
            {isEditing ? (
              <>
                <X size={12} color={colors.accent} />
                <Text style={styles.toggleEditBtnText}>CLOSE EDITOR</Text>
              </>
            ) : (
              <>
                <Settings size={12} color={colors.accent} />
                <Text style={styles.toggleEditBtnText}>EDIT DOSSIER</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.operatorSessionTag}>
            authenticated: @{operatorUser || 'operator'}
          </Text>
        </View>
      )}

      {/* EDIT CONSOLE CARD (Web-like interactive editor) */}
      {isEditing && token && (
        <View style={styles.editorCard}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          <View style={styles.editorHeader}>
            <Text style={styles.editorTag}>// DOSSIER CONSOLE — EDIT OPERATOR PROFILE</Text>
          </View>

          {/* Name & Handle */}
          <View style={styles.fieldRow}>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>OPERATOR NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Kur Zagin"
                placeholderTextColor={colors.textDim}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>HANDLE *</Text>
              <TextInput
                style={styles.textInput}
                value={handle}
                onChangeText={setHandle}
                placeholder="@kurzagin"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Location & Status Message */}
          <View style={styles.fieldRow}>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>COORDINATES / LOCATION</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="35.6614° N, 139.6681° E"
                placeholderTextColor={colors.textDim}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>STATUS MESSAGE</Text>
              <TextInput
                style={styles.textInput}
                value={statusMessage}
                onChangeText={setStatusMessage}
                placeholder="online / deploying"
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>

          {/* Headline */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>HEADLINE / ROLE SUMMARY</Text>
            <TextInput
              style={styles.textInput}
              value={headline}
              onChangeText={setHeadline}
              placeholder="System architect, solo developer, builder..."
              placeholderTextColor={colors.textDim}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>EXTENDED BIO</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Write biography, background and notes..."
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Avatar & Banner upload */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>AVATAR (1:1 AVIF • R2)</Text>
            <View style={styles.mediaRow}>
              <View style={styles.avatarMiniPreview}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.miniImg} />
                ) : (
                  <Text style={styles.avatarSymbolSmall}>𒀭</Text>
                )}
              </View>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://... or upload AVIF to R2"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Upload size={11} color={colors.accent} />
                    <Text style={styles.uploadBtnText}>UPLOAD</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>BANNER (WIDE AVIF • R2)</Text>
            <View style={styles.mediaRow}>
              <View style={styles.bannerMiniPreview}>
                {bannerUrl ? (
                  <Image source={{ uri: bannerUrl }} style={styles.miniImg} />
                ) : (
                  <Text style={styles.bannerEmptyText}>NO BANNER</Text>
                )}
              </View>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={bannerUrl}
                onChangeText={setBannerUrl}
                placeholder="https://... or upload banner"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handlePickBanner}
                disabled={uploadingBanner}
              >
                {uploadingBanner ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Upload size={11} color={colors.accent} />
                    <Text style={styles.uploadBtnText}>UPLOAD</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Email & Note */}
          <View style={styles.fieldRow}>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>PRIMARY CONTACT EMAIL</Text>
              <TextInput
                style={styles.textInput}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="operator@kurzagin.com"
                placeholderTextColor={colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>CONTACT / COLLAB NOTE</Text>
              <TextInput
                style={styles.textInput}
                value={contactNote}
                onChangeText={setContactNote}
                placeholder="Open for technical collaborations..."
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>

          {/* Tech Stack */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>TECH STACK & TOOLS (COMMA-SEPARATED)</Text>
            <TextInput
              style={styles.textInput}
              value={techStackStr}
              onChangeText={setTechStackStr}
              placeholder="TypeScript, Python, Rust, Astro, Cloudflare, React Native"
              placeholderTextColor={colors.textDim}
            />
          </View>

          {/* Currently Building Repeater */}
          <View style={styles.repeaterSection}>
            <View style={styles.repeaterHead}>
              <Text style={styles.repeaterTitle}>CURRENTLY BUILDING (PROJECTS)</Text>
              <TouchableOpacity style={styles.addBtn} onPress={addProject}>
                <Plus size={11} color={colors.accent} />
                <Text style={styles.addBtnText}>ADD PROJECT</Text>
              </TouchableOpacity>
            </View>

            {projects.map((proj, idx) => (
              <View key={`proj-${idx}`} style={styles.repeaterItem}>
                <View style={styles.repeaterHeaderRow}>
                  <Text style={styles.repeaterIndex}>// PROJECT 0{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeProject(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={12} color={colors.danger || '#ef4444'} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.textInput, styles.repeaterInput]}
                  value={proj.title}
                  onChangeText={(val) => updateProject(idx, 'title', val)}
                  placeholder="Project Title"
                  placeholderTextColor={colors.textDim}
                />
                <TextInput
                  style={[styles.textInput, styles.repeaterInput]}
                  value={proj.description}
                  onChangeText={(val) => updateProject(idx, 'description', val)}
                  placeholder="Short Description"
                  placeholderTextColor={colors.textDim}
                />
                <View style={styles.fieldRow}>
                  <TextInput
                    style={[styles.textInput, styles.repeaterInput, { flex: 2 }]}
                    value={proj.url || ''}
                    onChangeText={(val) => updateProject(idx, 'url', val)}
                    placeholder="URL (optional)"
                    placeholderTextColor={colors.textDim}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.textInput, styles.repeaterInput, { flex: 1 }]}
                    value={proj.badge || ''}
                    onChangeText={(val) => updateProject(idx, 'badge', val)}
                    placeholder="Badge (e.g. Active)"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Social Links Repeater */}
          <View style={styles.repeaterSection}>
            <View style={styles.repeaterHead}>
              <Text style={styles.repeaterTitle}>SOCIAL & LINKS</Text>
              <TouchableOpacity style={styles.addBtn} onPress={addSocial}>
                <Plus size={11} color={colors.accent} />
                <Text style={styles.addBtnText}>ADD LINK</Text>
              </TouchableOpacity>
            </View>

            {socials.map((soc, idx) => (
              <View key={`soc-${idx}`} style={styles.repeaterItem}>
                <View style={styles.repeaterHeaderRow}>
                  <Text style={styles.repeaterIndex}>// LINK 0{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeSocial(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={12} color={colors.danger || '#ef4444'} />
                  </TouchableOpacity>
                </View>
                <View style={styles.fieldRow}>
                  <TextInput
                    style={[styles.textInput, styles.repeaterInput, { flex: 1 }]}
                    value={soc.platform}
                    onChangeText={(val) => updateSocial(idx, 'platform', val)}
                    placeholder="Platform (e.g. GitHub)"
                    placeholderTextColor={colors.textDim}
                  />
                  <TextInput
                    style={[styles.textInput, styles.repeaterInput, { flex: 1 }]}
                    value={soc.label || ''}
                    onChangeText={(val) => updateSocial(idx, 'label', val)}
                    placeholder="Label (@kurzagin)"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
                <TextInput
                  style={[styles.textInput, styles.repeaterInput]}
                  value={soc.url}
                  onChangeText={(val) => updateSocial(idx, 'url', val)}
                  placeholder="Target URL (https://...)"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          {/* Contact Methods Repeater */}
          <View style={styles.repeaterSection}>
            <View style={styles.repeaterHead}>
              <Text style={styles.repeaterTitle}>CONTACT CHANNELS</Text>
              <TouchableOpacity style={styles.addBtn} onPress={addContact}>
                <Plus size={11} color={colors.accent} />
                <Text style={styles.addBtnText}>ADD CHANNEL</Text>
              </TouchableOpacity>
            </View>

            {contacts.map((con, idx) => (
              <View key={`con-${idx}`} style={styles.repeaterItem}>
                <View style={styles.repeaterHeaderRow}>
                  <Text style={styles.repeaterIndex}>// CHANNEL 0{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeContact(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={12} color={colors.danger || '#ef4444'} />
                  </TouchableOpacity>
                </View>
                <View style={styles.fieldRow}>
                  <TextInput
                    style={[styles.textInput, styles.repeaterInput, { flex: 1 }]}
                    value={con.method}
                    onChangeText={(val) => updateContact(idx, 'method', val)}
                    placeholder="Method (e.g. Discord)"
                    placeholderTextColor={colors.textDim}
                  />
                  <TextInput
                    style={[styles.textInput, styles.repeaterInput, { flex: 1.5 }]}
                    value={con.value}
                    onChangeText={(val) => updateContact(idx, 'value', val)}
                    placeholder="Handle / Address"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
                <TextInput
                  style={[styles.textInput, styles.repeaterInput]}
                  value={con.link || ''}
                  onChangeText={(val) => updateContact(idx, 'link', val)}
                  placeholder="Action Link (optional: https:// or mailto:)"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          {/* Status & Error display */}
          {errorMsg && (
            <Text style={styles.errorText}>// ERROR: {errorMsg}</Text>
          )}
          {statusMsg && (
            <Text style={styles.statusSuccessText}>{statusMsg}</Text>
          )}

          {/* Save / Cancel buttons */}
          <View style={styles.editorActionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsEditing(false)}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0a0a0c" />
              ) : (
                <>
                  <Check size={13} color="#0a0a0c" />
                  <Text style={styles.saveBtnText}>SAVE CHANGES →</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Operator Card Display (1:1 Web Layout) */}
      <View style={styles.card}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Profile Banner */}
        {profile?.banner_url ? (
          <View style={styles.bannerWrap}>
            <Image source={{ uri: profile.banner_url }} style={styles.bannerImg} />
            <View style={styles.bannerOverlay} />
          </View>
        ) : null}

        <View style={styles.profileTop}>
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarSymbol}>𒀭</Text>
              </View>
            )}
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile?.name || 'Kur Zagin'}</Text>
              {profile?.status_message && (
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusBadgeText}>{profile.status_message}</Text>
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.handle}>{profile?.handle || '@kurzagin'}</Text>
              {profile?.location && (
                <Text style={styles.location}>[{profile.location}]</Text>
              )}
            </View>
          </View>
        </View>

        {profile?.headline ? (
          <Text style={styles.headline}>{profile.headline}</Text>
        ) : null}

        {/* 01. IDENTITY & BIO */}
        {profile?.bio ? (
          <View style={styles.subBlock}>
            <View style={styles.subBlockHeader}>
              <Text style={styles.subBlockTitle}>
                <Text style={{ color: colors.accent }}>// 01. </Text>IDENTITY &amp; BIO
              </Text>
              <Text style={styles.jpMiniLabel}>概要</Text>
            </View>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* 02. CURRENTLY BUILDING */}
        <View style={styles.subBlock}>
          <View style={styles.subBlockHeader}>
            <Text style={styles.subBlockTitle}>
              <Text style={{ color: colors.accent }}>// 02. </Text>CURRENTLY BUILDING
            </Text>
            {displayProjects.length > 0 && (
              <Text style={styles.buildingCount}>
                // {displayProjects.length} ACTIVE
              </Text>
            )}
          </View>

          {displayProjects.length === 0 ? (
            <Text style={styles.emptyProjects}>// no active projects listed</Text>
          ) : (
            displayProjects.map((proj, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.projectCard}
                activeOpacity={0.85}
                onPress={() => proj.url && Linking.openURL(proj.url)}
              >
                <View style={styles.projectHead}>
                  <View style={styles.projectTitleRow}>
                    <ArrowRight size={12} color={colors.accent} />
                    <Text style={styles.projectTitle}>{proj.title}</Text>
                  </View>
                  {proj.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{proj.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.projectDesc}>{proj.description}</Text>
                {proj.url && (
                  <View style={styles.projectFoot}>
                    <Text style={styles.projectUrl} numberOfLines={1}>{proj.url}</Text>
                    <ArrowUpRight size={12} color={colors.accent} />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 03. TOOLS & ARCHITECTURE (TECH STACK) */}
        {displayTechStack.length > 0 && (
          <View style={styles.subBlock}>
            <View style={styles.subBlockHeader}>
              <Text style={styles.subBlockTitle}>
                <Text style={{ color: colors.accent }}>// 03. </Text>TOOLS &amp; ARCHITECTURE
              </Text>
              <Text style={styles.jpMiniLabel}>技術スタック</Text>
            </View>
            <View style={styles.techPillGrid}>
              {displayTechStack.map((tech, idx) => (
                <View key={idx} style={styles.techPill}>
                  <Text style={styles.techPillText}>{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 04. SOCIAL & LINKS */}
        {displaySocials.length > 0 && (
          <View style={styles.subBlock}>
            <View style={styles.subBlockHeader}>
              <Text style={styles.subBlockTitle}>
                <Text style={{ color: colors.accent }}>// 04. </Text>SOCIAL &amp; LINKS
              </Text>
              <Text style={styles.jpMiniLabel}>通信網</Text>
            </View>
            <View style={styles.socialCol}>
              {displaySocials.map((link, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.socialCardRow}
                  onPress={() => Linking.openURL(link.url)}
                >
                  <View style={styles.socialCardLeft}>
                    <Globe size={13} color={colors.accent} />
                    <Text style={styles.socialCardPlatform}>{link.platform}</Text>
                    {link.label && (
                      <Text style={styles.socialCardLabel}>({link.label})</Text>
                    )}
                  </View>
                  <ExternalLink size={11} color={colors.textDim} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 05. CONTACT & COLLABORATION */}
        {(displayContacts.length > 0 || profile?.contact_email || profile?.contact_note) && (
          <View style={styles.subBlock}>
            <View style={styles.subBlockHeader}>
              <Text style={styles.subBlockTitle}>
                <Text style={{ color: colors.accent }}>// 05. </Text>CONTACT &amp; COLLABORATION
              </Text>
              <Text style={styles.jpMiniLabel}>連絡先</Text>
            </View>

            {profile?.contact_note ? (
              <Text style={styles.contactNote}>{profile.contact_note}</Text>
            ) : null}

            <View style={styles.contactBox}>
              {displayContacts.map((c, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.contactMethodRow}
                  disabled={!c.link}
                  onPress={() => c.link && Linking.openURL(c.link)}
                >
                  <Text style={styles.contactMethodLabel}>{c.method.toUpperCase()}</Text>
                  <Text
                    style={[
                      styles.contactMethodVal,
                      c.link ? { color: colors.accent } : undefined,
                    ]}
                  >
                    {c.value}
                  </Text>
                </TouchableOpacity>
              ))}

              {profile?.contact_email &&
                !displayContacts.some((d) => d.value === profile.contact_email) && (
                  <TouchableOpacity
                    style={styles.contactMethodRow}
                    onPress={() => Linking.openURL(`mailto:${profile.contact_email}`)}
                  >
                    <Text style={styles.contactMethodLabel}>DIRECT EMAIL</Text>
                    <Text style={[styles.contactMethodVal, { color: colors.accent }]}>
                      {profile.contact_email}
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  toggleEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toggleEditBtnActive: {
    backgroundColor: '#1d1916',
    borderColor: colors.border,
  },
  toggleEditBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  operatorSessionTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  editorCard: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  editorHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 8,
    marginBottom: spacing.md,
  },
  editorTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1,
  },
  fieldGroup: {
    marginBottom: spacing.sm + 2,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm + 2,
  },
  halfField: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 3,
    color: colors.text,
    fontFamily: typography.fontMono,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarMiniPreview: {
    width: 36,
    height: 36,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#0a0a0c',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerMiniPreview: {
    width: 50,
    height: 36,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#0a0a0c',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniImg: {
    width: '100%',
    height: '100%',
  },
  avatarSymbolSmall: {
    color: colors.accent,
    fontSize: 16,
  },
  bannerEmptyText: {
    fontFamily: typography.fontMono,
    fontSize: 7,
    color: colors.textDim,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  uploadBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  repeaterSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: spacing.sm,
  },
  repeaterHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repeaterTitle: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  addBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
  },
  repeaterItem: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#202024',
    padding: 8,
    borderRadius: 3,
    marginBottom: 8,
  },
  repeaterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  repeaterIndex: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
  },
  repeaterInput: {
    marginBottom: 6,
  },
  errorText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.danger || '#ef4444',
    marginTop: 6,
  },
  statusSuccessText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.success || '#22c55e',
    marginTop: 6,
  },
  editorActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
  },
  cancelBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
  },
  saveBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0a0a0c',
  },
  card: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerWrap: {
    height: 100,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 12, 0.4)',
  },
  corner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: colors.accent,
    zIndex: 10,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarWrap: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSymbol: {
    color: colors.accent,
    fontSize: 20,
  },
  profileHeader: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontFamily: typography.fontSans,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  statusBadgeText: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.success,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  handle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  location: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
  },
  headline: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  subBlock: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: spacing.md,
  },
  subBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subBlockTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  jpMiniLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  bioText: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  buildingCount: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
  },
  emptyProjects: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  projectCard: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  projectHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectTitle: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  badge: {
    backgroundColor: 'rgba(224, 169, 109, 0.1)',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  badgeText: {
    fontFamily: typography.fontMono,
    fontSize: 8,
    color: colors.accent,
  },
  projectDesc: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  projectFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  projectUrl: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    flex: 1,
  },
  techPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  techPill: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  techPillText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  socialCol: {
    gap: 6,
  },
  socialCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 3,
  },
  socialCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialCardPlatform: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
  },
  socialCardLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  contactNote: {
    fontFamily: typography.fontSans,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 17,
  },
  contactBox: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 3,
    padding: 10,
    gap: 8,
  },
  contactMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactMethodLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  contactMethodVal: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.text,
  },
});
