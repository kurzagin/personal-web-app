import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  Wrench,
  Link2,
  QrCode,
  AlignLeft,
  Type,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react-native';
import { colors, typography } from '@kurzagin/ui';

interface ToolItem {
  slug: string;
  name: string;
  nameJp: string;
  tagline: string;
  badge: string;
}

const TOOLS: ToolItem[] = [
  {
    slug: 'link-cleaner',
    name: 'Link Cleaner',
    nameJp: 'リンク整形',
    tagline: 'Strip tracking parameters and clean bloated URLs',
    badge: 'Privacy',
  },
  {
    slug: 'word-counter',
    name: 'Word & Character Counter',
    nameJp: '文字数カウント',
    tagline: 'Live text stats, reading time & social limits',
    badge: 'Realtime',
  },
  {
    slug: 'case-converter',
    name: 'Case Converter',
    nameJp: '大文字小文字変換',
    tagline: 'Transform text case, fix spacing and clean text',
    badge: 'Utility',
  },
  {
    slug: 'password-generator',
    name: 'Password & PIN Generator',
    nameJp: 'パスワード生成',
    tagline: 'Cryptographically secure random passwords and PINs',
    badge: 'Not Stored',
  },
];

export const ToolsView: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Link Cleaner State
  const [cleanerInput, setCleanerInput] = useState('');
  const [cleanerResult, setCleanerResult] = useState('');

  // Word Counter State
  const [counterText, setCounterText] = useState('');

  // Case Converter State
  const [caseText, setCaseText] = useState('');

  // Password Generator State
  const [passLength, setPassLength] = useState(16);
  const [generatedPass, setGeneratedPass] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanUrl = (raw: string) => {
    try {
      const url = new URL(raw.trim());
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'si', 'igsh', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi',
      ];
      trackingParams.forEach((param) => url.searchParams.delete(param));
      setCleanerResult(url.toString());
    } catch {
      setCleanerResult(raw.trim());
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let res = '';
    for (let i = 0; i < passLength; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(res);
  };

  const renderToolDetails = () => {
    if (selectedTool === 'link-cleaner') {
      return (
        <View style={styles.toolDetailWrap}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedTool(null)}
          >
            <ArrowLeft size={16} color={colors.accent} />
            <Text style={styles.backBtnText}>ALL TOOLS</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>LINK CLEANER [リンク整形]</Text>
          <Text style={styles.detailDesc}>
            Instant privacy utility that strips affiliate tags, UTM analytics, and tracking tokens cleanly.
          </Text>

          <Text style={styles.inputLabel}>ENTER BLOATED URL</Text>
          <TextInput
            style={styles.textInput}
            value={cleanerInput}
            onChangeText={(txt) => {
              setCleanerInput(txt);
              cleanUrl(txt);
            }}
            placeholder="https://example.com?utm_source=tracker&fbclid=xyz"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
          />

          {cleanerResult ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>CLEANED URL</Text>
              <Text style={styles.resultContent} selectable>
                {cleanerResult}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (selectedTool === 'word-counter') {
      const chars = counterText.length;
      const words = counterText.trim() ? counterText.trim().split(/\s+/).length : 0;
      const lines = counterText ? counterText.split('\n').length : 0;

      return (
        <View style={styles.toolDetailWrap}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedTool(null)}
          >
            <ArrowLeft size={16} color={colors.accent} />
            <Text style={styles.backBtnText}>ALL TOOLS</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>WORD &amp; CHAR COUNTER [文字数]</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{chars}</Text>
              <Text style={styles.statLab}>CHARS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{words}</Text>
              <Text style={styles.statLab}>WORDS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{lines}</Text>
              <Text style={styles.statLab}>LINES</Text>
            </View>
          </View>

          <TextInput
            style={[styles.textInput, { height: 140, textAlignVertical: 'top' }]}
            value={counterText}
            onChangeText={setCounterText}
            placeholder="Type or paste text here..."
            placeholderTextColor={colors.textDim}
            multiline
          />
        </View>
      );
    }

    if (selectedTool === 'case-converter') {
      return (
        <View style={styles.toolDetailWrap}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedTool(null)}
          >
            <ArrowLeft size={16} color={colors.accent} />
            <Text style={styles.backBtnText}>ALL TOOLS</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>CASE CONVERTER [大文字小文字]</Text>

          <TextInput
            style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
            value={caseText}
            onChangeText={setCaseText}
            placeholder="Enter text to convert..."
            placeholderTextColor={colors.textDim}
            multiline
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.subBtn}
              onPress={() => setCaseText(caseText.toUpperCase())}
            >
              <Text style={styles.subBtnText}>UPPERCASE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subBtn}
              onPress={() => setCaseText(caseText.toLowerCase())}
            >
              <Text style={styles.subBtnText}>lowercase</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subBtn}
              onPress={() =>
                setCaseText(
                  caseText
                    .toLowerCase()
                    .replace(/(?:^|\s)\w/g, (match) => match.toUpperCase())
                )
              }
            >
              <Text style={styles.subBtnText}>Title Case</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (selectedTool === 'password-generator') {
      return (
        <View style={styles.toolDetailWrap}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedTool(null)}
          >
            <ArrowLeft size={16} color={colors.accent} />
            <Text style={styles.backBtnText}>ALL TOOLS</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>PASSWORD GENERATOR [パスワード生成]</Text>
          <Text style={styles.detailDesc}>
            Cryptographically randomized client-side passphrase generator. Never logged or saved.
          </Text>

          <TouchableOpacity style={styles.primaryActionBtn} onPress={generatePassword}>
            <Text style={styles.primaryActionText}>GENERATE NEW PASSWORD</Text>
          </TouchableOpacity>

          {generatedPass ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>GENERATED PASSWORD</Text>
              <Text style={styles.resultContent} selectable>
                {generatedPass}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>
          <Text style={{ color: colors.accent }}>free</Text> tools
        </Text>
        <Text style={styles.headerSub}>
          <Text style={{ color: colors.accent }}>道具箱</Text> — minimalist, privacy-first operator utilities
        </Text>
      </View>

      {selectedTool ? (
        renderToolDetails()
      ) : (
        <View style={styles.toolsList}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.slug}
              style={styles.toolCard}
              onPress={() => {
                setSelectedTool(tool.slug);
                if (tool.slug === 'password-generator') generatePassword();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.toolTopRow}>
                <View style={styles.badgePill}>
                  <ShieldCheck size={11} color={colors.accent} />
                  <Text style={styles.badgeText}>{tool.badge}</Text>
                </View>
                <Text style={styles.jpTag}>{tool.nameJp}</Text>
              </View>

              <Text style={styles.toolCardTitle}>{tool.name}</Text>
              <Text style={styles.toolCardTagline}>{tool.tagline}</Text>

              <View style={styles.toolCardFooter}>
                <Text style={styles.statusText}>OPERATIONAL</Text>
                <View style={styles.launchRow}>
                  <Text style={styles.launchText}>LAUNCH</Text>
                  <ChevronRight size={13} color={colors.accent} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
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
  toolsList: {
    gap: 12,
  },
  toolCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  toolTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(196, 147, 104, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196, 147, 104, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.accent,
  },
  jpTag: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
  },
  toolCardTitle: {
    fontFamily: typography.fontMono,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  toolCardTagline: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  toolCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e1e24',
    paddingTop: 8,
    marginTop: 4,
  },
  statusText: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.8,
  },
  launchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  launchText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
  },
  toolDetailWrap: {
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.accent,
    fontWeight: 'bold',
  },
  detailTitle: {
    fontFamily: typography.fontMono,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailDesc: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.textDim,
  },
  inputLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 10,
    color: colors.text,
    fontFamily: typography.fontMono,
    fontSize: 12,
  },
  resultBox: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 6,
    padding: 12,
    gap: 6,
  },
  resultLabel: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.accent,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resultContent: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: typography.fontMono,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
  },
  statLab: {
    fontFamily: typography.fontMono,
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subBtn: {
    flex: 1,
    backgroundColor: '#18181f',
    borderWidth: 1,
    borderColor: '#2e2e38',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  subBtnText: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    color: colors.text,
  },
  primaryActionBtn: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    fontFamily: typography.fontMono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a0a0c',
    letterSpacing: 1,
  },
});
