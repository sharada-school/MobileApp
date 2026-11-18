import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useParent } from '../context/ParentContext';
import { api, AttendanceData, AttendanceRecord } from '../services/api';
import { KidSelector } from './KidSelector';
import { Ionicons } from '@expo/vector-icons';

export const AttendanceView: React.FC = () => {
  const { activeKid } = useParent();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadAttendance = async () => {
    if (!activeKid) return;
    const studentId = activeKid.id || activeKid._id;
    if (!studentId) return;

    try {
      const res = await api.getAttendance(studentId);
      setData(res);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadAttendance();
  }, [activeKid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  if (!activeKid) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No student selected.</Text>
      </View>
    );
  }

  const stats = data?.stats || {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    lateDays: 0,
    percentage: 0,
  };

  const records = (data?.records || []).filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status.toUpperCase() === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'Absent':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'Half Day':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
      case 'Late':
        return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Kid Selector */}
      <KidSelector />

      {/* Main Attendance Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewTop}>
          <View>
            <Text style={styles.overviewLabel}>Overall Attendance</Text>
            <Text style={styles.studentSub}>
              {activeKid.firstName} {activeKid.lastName} • Class {activeKid.className}
            </Text>
          </View>
          <View
            style={[
              styles.percentageBadge,
              stats.percentage >= 85
                ? styles.pctGood
                : stats.percentage >= 75
                ? styles.pctAverage
                : styles.pctLow,
            ]}
          >
            <Text style={styles.percentageNumber}>{stats.percentage}%</Text>
          </View>
        </View>

        {/* Attendance Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(stats.percentage, 100)}%` }]} />
        </View>

        {/* Metric Counters */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: '#F8FAFC' }]}>
            <Text style={styles.statBoxNumber}>{stats.totalDays}</Text>
            <Text style={styles.statBoxLabel}>Total Days</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.statBoxNumber, { color: '#16A34A' }]}>{stats.presentDays}</Text>
            <Text style={styles.statBoxLabel}>Present</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.statBoxNumber, { color: '#DC2626' }]}>{stats.absentDays}</Text>
            <Text style={styles.statBoxLabel}>Absent</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FFFBEB' }]}>
            <Text style={[styles.statBoxNumber, { color: '#D97706' }]}>{stats.halfDays}</Text>
            <Text style={styles.statBoxLabel}>Half Day</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#F5F3FF' }]}>
            <Text style={[styles.statBoxNumber, { color: '#7C3AED' }]}>{stats.lateDays}</Text>
            <Text style={styles.statBoxLabel}>Late</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Attendance History</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['ALL', 'PRESENT', 'ABSENT', 'HALF DAY', 'LATE'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loading or List */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading attendance records...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={40} color="#94A3B8" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyBoxTitle}>No records found</Text>
          <Text style={styles.emptyBoxDesc}>
            No attendance entries matching the selected filter.
          </Text>
        </View>
      ) : (
        <View style={styles.recordsList}>
          {records.map((item, index) => {
            const colors = getStatusColor(item.status);
            return (
              <View key={item.id || index} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.recordSession}>{item.sessionStatus || 'Full Day'}</Text>
                  {item.remarks ? (
                    <Text style={styles.recordRemarks}>“{item.remarks}”</Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
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
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },
  overviewCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  percentageBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pctGood: {
    backgroundColor: '#DCFCE7',
  },
  pctAverage: {
    backgroundColor: '#FEF3C7',
  },
  pctLow: {
    backgroundColor: '#FEE2E2',
  },
  percentageNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  filterSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  emptyBox: {
    margin: 24,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyBoxEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyBoxDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  recordsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordLeft: {
    flex: 1,
    marginRight: 10,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  recordSession: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  recordRemarks: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#475569',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
