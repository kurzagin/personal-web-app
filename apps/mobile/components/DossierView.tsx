import React from 'react';
import { View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import { ExternalLink, Mail, ArrowRight, ArrowUpRight } from 'lucide-react-native';
import { colors, typography, spacing } from '@kurzagin/ui';
import type { WebProfile, ProjectEntry } from '../lib/api';

interface DossierViewProps {
  profile: WebProfile | null;
  endpoint: string;
}

export const DossierView: React.FC<DossierViewProps> = ({ profile, endpoint }) => {
  const projects = (profile?.currently_building || []) as ProjectEntry[];

  return (
    <View style={styles.container}>
      {/* Operator Card */}
      <View style={styles.card}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerBR]} />

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

        <Text style={styles.headline}>
          {profile?.headline || 'System architect, solo developer, and builder of strange but useful things.'}
        </Text>

        {/* Social / Contact Links */}
        <View style={styles.socialRow}>
          {profile?.social_links?.map((link, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.socialChip}
              onPress={() => Linking.openURL(link.url)}
            >
              <Text style={styles.socialText}>{link.platform}</Text>
              <ExternalLink size={10} color={colors.textDim} />
            </TouchableOpacity>
          ))}

          {profile?.contact_email && (
            <TouchableOpacity
              style={styles.socialChip}
              onPress={() => Linking.openURL(`mailto:${profile.contact_email}`)}
            >
              <Mail size={11} color={colors.accent} />
              <Text style={[styles.socialText, { color: colors.accent }]}>contact</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Currently Building Grid (1:1 Web) */}
        <View style={styles.buildingSection}>
          <View style={styles.buildingHeader}>
            <Text style={styles.buildingTitle}>
              <Text style={{ color: colors.accent }}>// </Text>CURRENTLY BUILDING
            </Text>
            {projects.length > 0 && (
              <Text style={styles.buildingCount}>
                // {projects.length} ACTIVE
              </Text>
            )}
          </View>

          {projects.length === 0 ? (
            <Text style={styles.emptyProjects}>// no active projects listed</Text>
          ) : (
            projects.map((proj, idx) => (
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
      </View>

      {/* Node Diagnostics */}
      <View style={[styles.card, { marginTop: spacing.md }]}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Text style={styles.diagTitle}>// RUNTIME TELEMETRY</Text>
        <Text style={styles.diagText}>CONNECTED ENDPOINT: <Text style={styles.hl}>{endpoint}</Text></Text>
        <Text style={styles.diagText}>DATABASE: <Text style={styles.hl}>Cloudflare D1 (SQL)</Text></Text>
        <Text style={styles.diagText}>OBJECT STORAGE: <Text style={styles.hl}>Cloudflare R2</Text></Text>
        <Text style={styles.diagText}>MOBILE CLIENT: <Text style={styles.hl}>Zero Creds Bundled</Text></Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: spacing.lg,
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
    marginVertical: spacing.sm,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  socialText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  buildingSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: spacing.md,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buildingTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
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
  diagTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  diagText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    lineHeight: 18,
  },
  hl: {
    color: colors.text,
  },
});
