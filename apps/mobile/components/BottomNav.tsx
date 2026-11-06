import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, SquarePen, Disc3, Inbox, User } from 'lucide-react-native';
import { colors, typography } from '@kurzagin/ui';

export type TabKey = 'home' | 'blog' | 'music' | 'messages' | 'profile';

interface BottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <Home size={18} color={activeTab === 'home' ? colors.accent : colors.textDim} />
        <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
          home
        </Text>
        {activeTab === 'home' && <View style={styles.indicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('blog')}
        activeOpacity={0.7}
      >
        <SquarePen size={18} color={activeTab === 'blog' ? colors.accent : colors.textDim} />
        <Text style={[styles.navLabel, activeTab === 'blog' && styles.navLabelActive]}>
          blog
        </Text>
        {activeTab === 'blog' && <View style={styles.indicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('music')}
        activeOpacity={0.7}
      >
        <Disc3 size={18} color={activeTab === 'music' ? colors.accent : colors.textDim} />
        <Text style={[styles.navLabel, activeTab === 'music' && styles.navLabelActive]}>
          music
        </Text>
        {activeTab === 'music' && <View style={styles.indicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('messages')}
        activeOpacity={0.7}
      >
        <Inbox size={18} color={activeTab === 'messages' ? colors.accent : colors.textDim} />
        <Text style={[styles.navLabel, activeTab === 'messages' && styles.navLabelActive]}>
          inbox
        </Text>
        {activeTab === 'messages' && <View style={styles.indicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelectTab('profile')}
        activeOpacity={0.7}
      >
        <User size={18} color={activeTab === 'profile' ? colors.accent : colors.textDim} />
        <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
          profile
        </Text>
        {activeTab === 'profile' && <View style={styles.indicator} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: 'rgba(10, 10, 12, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    gap: 3,
  },
  navLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  indicator: {
    position: 'absolute',
    bottom: 2,
    width: 14,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
});
