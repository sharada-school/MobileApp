import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useParent } from '@/context/ParentContext';
import { PhoneLogin } from '@/components/PhoneLogin';
import { ParentHomeView } from '@/components/ParentHomeView';
import { AttendanceView } from '@/components/AttendanceView';
import { MarksView } from '@/components/MarksView';
import { AllChildrenView } from '@/components/AllChildrenView';
import { ParentProfileView } from '@/components/ParentProfileView';

type TabType = 'home' | 'attendance' | 'marks' | 'children' | 'profile';

export default function HomeScreen() {
  const { isLoggedIn, isLoading, activeKid, kids } = useParent();
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Sharada English Medium School...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <PhoneLogin />;
  }

  return (
    <View style={styles.container}>
      {/* App Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/images/school-logo.png')}
            style={styles.schoolLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.schoolTitle}>Sharada English Medium School</Text>
            <Text style={styles.schoolSubtitle}>Cherkady • Est. 2017</Text>
          </View>
        </View>

        {activeKid && (
          <TouchableOpacity
            style={styles.activeKidPill}
            onPress={() => setCurrentTab('children')}
          >
            <Text style={styles.activeKidPillLabel}>Student:</Text>
            <Text style={styles.activeKidPillName} numberOfLines={1}>
              {activeKid.firstName} ({activeKid.className || '-'})
            </Text>
            {kids.length > 1 && (
              <View style={styles.kidsCountTag}>
                <Text style={styles.kidsCountTagText}>{kids.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Main Screen Content */}
      <View style={styles.mainContent}>
        {currentTab === 'home' && <ParentHomeView onNavigateTab={(t) => setCurrentTab(t)} />}
        {currentTab === 'attendance' && <AttendanceView />}
        {currentTab === 'marks' && <MarksView />}
        {currentTab === 'children' && <AllChildrenView onSelectTab={(t) => setCurrentTab(t)} />}
        {currentTab === 'profile' && <ParentProfileView />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('home')}
        >
          <Ionicons
            name={currentTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={currentTab === 'home' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('attendance')}
        >
          <Ionicons
            name={currentTab === 'attendance' ? 'calendar' : 'calendar-outline'}
            size={22}
            color={currentTab === 'attendance' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'attendance' && styles.navLabelActive]}>
            Attendance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('marks')}
        >
          <Ionicons
            name={currentTab === 'marks' ? 'ribbon' : 'ribbon-outline'}
            size={22}
            color={currentTab === 'marks' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'marks' && styles.navLabelActive]}>Marks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('children')}
        >
          <View style={styles.navItemWithBadge}>
            <Ionicons
              name={currentTab === 'children' ? 'people' : 'people-outline'}
              size={22}
              color={currentTab === 'children' ? '#2563EB' : '#64748B'}
            />
            {kids.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{kids.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, currentTab === 'children' && styles.navLabelActive]}>
            My Kids
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('profile')}
        >
          <Ionicons
            name={currentTab === 'profile' ? 'person-circle' : 'person-circle-outline'}
            size={22}
            color={currentTab === 'profile' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.navLabel, currentTab === 'profile' && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  schoolLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  schoolTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  schoolSubtitle: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 1,
  },
  activeKidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 4,
    maxWidth: 150,
  },
  activeKidPillLabel: {
    fontSize: 10,
    color: '#4338CA',
    fontWeight: '600',
  },
  activeKidPillName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#312E81',
  },
  kidsCountTag: {
    backgroundColor: '#4338CA',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  kidsCountTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    gap: 3,
  },
  navItemWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
});
