import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useParent } from '../context/ParentContext';
import { api, ParentSummary, ParentSummaryItem, Student } from '../services/api';

interface AllChildrenViewProps {
  onSelectTab?: (tab: 'attendance' | 'marks') => void;
}

export const AllChildrenView: React.FC<AllChildrenViewProps> = ({ onSelectTab }) => {
  const { kids, activeKid, setActiveKid } = useParent();
  const [summary, setSummary] = useState<ParentSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadSummary = async () => {
    try {
      const res = await api.getSummary();
      setSummary(res);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [kids]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  const AVATAR_COLORS = [
    { bg: '#EBF3FF', text: '#2563EB', border: '#BFDBFE' },
    { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' },
    { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>Enrolled Students</Text>
        <Text style={styles.headerSubtitle}>
          You have {kids.length} {kids.length === 1 ? 'student' : 'students'} enrolled at Sharada English Medium School
        </Text>
        {kids.length > 2 && (
          <View style={styles.multiChildBadge}>
            <Text style={styles.multiChildBadgeText}>
              ✓ Family with {kids.length} Students
            </Text>
          </View>
        )}
      </View>

      {/* Children List */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading student records...</Text>
        </View>
      ) : (
        <View style={styles.kidsList}>
          {kids.map((kid: Student, index: number) => {
            const kidId = kid.id || kid._id;
            const activeId = activeKid?.id || activeKid?._id;
            const isSelected = kidId === activeId;
            const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const initials = `${kid.firstName?.[0] || ''}${kid.lastName?.[0] || ''}`.toUpperCase() || 'S';

            // Find matching item from summary
            const summaryItem = summary?.kids?.find(
              (k: ParentSummaryItem) => (k.student.id || k.student._id) === kidId
            );

            const attendancePercent = summaryItem?.attendance?.percentage ?? (kid.stats?.attendancePercent ?? 0);
            const latestGrade = summaryItem?.academics?.grade || (kid.grade || '-');
            const latestExam = summaryItem?.academics?.latestExam || 'Latest';
            const presentDays = summaryItem?.attendance?.presentDays ?? (kid.stats?.attendanceRecords ?? 0);

            return (
              <View
                key={kidId || index}
                style={[styles.kidCard, isSelected && styles.kidCardSelected]}
              >
                <View style={styles.kidTopRow}>
                  <View style={[styles.avatar, { backgroundColor: color.bg, borderColor: color.border }]}>
                    <Text style={[styles.avatarText, { color: color.text }]}>{initials}</Text>
                  </View>

                  <View style={styles.kidMainDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.kidFullName}>
                        {kid.firstName} {kid.lastName}
                      </Text>
                      {isSelected && (
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.kidClassInfo}>
                      Class {kid.className || '-'}{kid.section ? ` (${kid.section})` : ''} • Roll #{kid.rollNumber || '-'}
                    </Text>
                    <Text style={styles.admissionText}>Adm No: {kid.admissionNo}</Text>
                  </View>
                </View>

                {/* Performance Snapshot */}
                <View style={styles.snapshotGrid}>
                  <View style={styles.snapshotBox}>
                    <Text style={styles.snapshotLabel}>Attendance</Text>
                    <Text style={[styles.snapshotValue, { color: attendancePercent >= 85 ? '#059669' : '#D97706' }]}>
                      {attendancePercent > 0 ? `${attendancePercent}%` : 'Pending'}
                    </Text>
                    <Text style={styles.snapshotSub}>
                      {presentDays} Days Recorded
                    </Text>
                  </View>

                  <View style={styles.snapshotBox}>
                    <Text style={styles.snapshotLabel}>{latestExam} Grade</Text>
                    <Text style={[styles.snapshotValue, { color: '#2563EB' }]}>
                      {latestGrade}
                    </Text>
                    <Text style={styles.snapshotSub}>
                      {kid.stats?.marksRecorded ? `${kid.stats.marksRecorded} Tests Recorded` : 'Enrolled'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnOutline]}
                    onPress={() => {
                      setActiveKid(kid);
                      if (onSelectTab) onSelectTab('attendance');
                    }}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnOutlineText}>Attendance</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnOutline]}
                    onPress={() => {
                      setActiveKid(kid);
                      if (onSelectTab) onSelectTab('marks');
                    }}
                  >
                    <Ionicons name="ribbon-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnOutlineText}>Marks</Text>
                  </TouchableOpacity>

                  {!isSelected ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => setActiveKid(kid)}
                    >
                      <Text style={styles.actionBtnPrimaryText}>Select</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  multiChildBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  multiChildBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  kidsList: {
    gap: 14,
  },
  kidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kidCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#FAFCFF',
  },
  kidTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  kidMainDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kidFullName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  activePill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  kidClassInfo: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  admissionText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  snapshotGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  snapshotBox: {
    flex: 1,
    alignItems: 'center',
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  snapshotValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  snapshotSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutline: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionBtnPrimary: {
    backgroundColor: '#2563EB',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
