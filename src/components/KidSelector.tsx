import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useParent } from '../context/ParentContext';
import { Student } from '../services/api';

const AVATAR_COLORS = [
  { bg: '#EBF3FF', text: '#2563EB', border: '#BFDBFE' }, // Blue
  { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' }, // Pink
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // Emerald
  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' }, // Amber
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' }, // Purple
  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' }, // Rose
];

export const KidSelector: React.FC = () => {
  const { kids, activeKid, setActiveKid } = useParent();

  if (!kids || kids.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Students</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{kids.length} {kids.length === 1 ? 'Student' : 'Students'}</Text>
          </View>
        </View>
        {kids.length > 2 && (
          <Text style={styles.hintText}>Swipe to view all</Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {kids.map((kid, index) => {
          const kidId = kid.id || kid._id;
          const activeId = activeKid?.id || activeKid?._id;
          const isSelected = kidId === activeId;
          const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const initials = `${kid.firstName?.[0] || ''}${kid.lastName?.[0] || ''}`.toUpperCase() || 'S';

          return (
            <TouchableOpacity
              key={kidId || index}
              activeOpacity={0.8}
              onPress={() => setActiveKid(kid)}
              style={[
                styles.kidCard,
                isSelected && styles.kidCardSelected
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: color.bg, borderColor: color.border }]}>
                <Text style={[styles.avatarText, { color: color.text }]}>{initials}</Text>
                {isSelected && (
                  <View style={styles.activeDot} />
                )}
              </View>
              <View style={styles.kidInfo}>
                <Text style={[styles.kidName, isSelected && styles.kidNameSelected]} numberOfLines={1}>
                  {kid.firstName} {kid.lastName}
                </Text>
                <Text style={styles.kidClass}>
                  Class {kid.className || '-'}{kid.section ? ` (${kid.section})` : ''}
                </Text>
                {kid.rollNumber !== undefined && (
                  <Text style={styles.kidRoll}>Roll #{kid.rollNumber}</Text>
                )}
              </View>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  kidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    paddingRight: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 180,
    maxWidth: 240,
  },
  kidCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 10,
    position: 'relative',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  kidNameSelected: {
    color: '#1E293B',
    fontWeight: '700',
  },
  kidClass: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  kidRoll: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  selectedBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
