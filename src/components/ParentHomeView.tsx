import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useParent } from '../context/ParentContext';
import { KidSelector } from './KidSelector';

interface ParentHomeViewProps {
  onNavigateTab: (tab: 'attendance' | 'marks' | 'children' | 'profile') => void;
}

export const ParentHomeView: React.FC<ParentHomeViewProps> = ({ onNavigateTab }) => {
  const { parent, kids, activeKid } = useParent();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Welcome Bar */}
      <View style={styles.welcomeBar}>
        <View>
          <Text style={styles.welcomeGreeting}>Welcome back,</Text>
          <Text style={styles.userName}>{parent?.name || (parent?.phone ? `+91 ${parent.phone}` : 'Account')}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => onNavigateTab('profile')}>
          <Ionicons name="person-circle-outline" size={26} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* Multi-Child / Student Selector */}
      <KidSelector />

      {/* Selected Student Academic Cards */}
      {activeKid ? (
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeading}>
            {activeKid.firstName}'s Academic Overview
          </Text>

          {/* Attendance Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.featureCard}
            onPress={() => onNavigateTab('attendance')}
          >
            <View style={styles.featureCardTop}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="calendar-outline" size={24} color="#059669" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Attendance Tracker</Text>
                <Text style={styles.featureSubtitle}>Daily presence & session records</Text>
              </View>
              {activeKid.stats?.attendancePercent !== undefined ? (
                <View style={styles.statBadgeGood}>
                  <Text style={styles.statBadgeGoodText}>
                    {activeKid.stats.attendancePercent}%
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>
                Status: {activeKid.stats?.recentStatus || 'Enrolled'} • View attendance logs
              </Text>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Exam Marks Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.featureCard}
            onPress={() => onNavigateTab('marks')}
          >
            <View style={styles.featureCardTop}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="ribbon-outline" size={24} color="#2563EB" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Examination Results</Text>
                <Text style={styles.featureSubtitle}>Subject scores, oral tests & grades</Text>
              </View>
              {activeKid.stats?.marksRecorded ? (
                <View style={styles.statBadgeExam}>
                  <Text style={styles.statBadgeExamText}>
                    {activeKid.stats.marksRecorded} Marks
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>
                View all subjects and exam reports
              </Text>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Multi-Child Banner (if >1 kid) */}
          {kids.length > 1 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.multiChildCard}
              onPress={() => onNavigateTab('children')}
            >
              <View style={styles.multiChildTop}>
                <View style={styles.multiChildIconBox}>
                  <Ionicons name="people" size={24} color="#4338CA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.multiChildTitle}>
                    {kids.length > 2 ? `Family with ${kids.length} Students` : 'Compare Enrolled Students'}
                  </Text>
                  <Text style={styles.multiChildSub}>
                    View side-by-side attendance & performance comparison
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#4338CA" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.noKidsBox}>
          <Ionicons name="search-outline" size={40} color="#94A3B8" />
          <Text style={styles.noKidsTitle}>No Students Linked</Text>
          <Text style={styles.noKidsDesc}>
            No student records were found with mobile number: +91 {parent?.phone}.
            Please contact Sharada English Medium School office (Ph: 8867026358) to register your mobile number.
          </Text>
        </View>
      )}

      {/* School Announcements */}
      <View style={styles.announcementsSection}>
        <Text style={styles.sectionHeading}>School Notices & Events</Text>

        <View style={styles.noticeCard}>
          <View style={styles.noticeTag}>
            <Text style={styles.noticeTagText}>Notice</Text>
          </View>
          <Text style={styles.noticeTitle}>School Academic Calendar</Text>
          <Text style={styles.noticeDesc}>
            Sharada English Medium School, Cherkady. Regular classes ongoing. Check attendance and test marks regularly.
          </Text>
        </View>
      </View>
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
  welcomeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeGreeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 4,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statBadgeGood: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statBadgeGoodText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  statBadgeExam: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statBadgeExamText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  arrowText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '700',
  },
  multiChildCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  multiChildTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  multiChildIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiChildTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#312E81',
  },
  multiChildSub: {
    fontSize: 12,
    color: '#4338CA',
    marginTop: 2,
  },
  noKidsBox: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noKidsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
  },
  noKidsDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  announcementsSection: {
    marginTop: 18,
    paddingHorizontal: 16,
    gap: 10,
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeTag: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  noticeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  noticeDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
});
