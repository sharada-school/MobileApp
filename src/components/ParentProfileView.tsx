import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useParent } from '../context/ParentContext';

export const ParentProfileView: React.FC = () => {
  const { parent, kids, logout } = useParent();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={32} color="#2563EB" />
        </View>
        <Text style={styles.userName}>{parent?.name || (parent?.phone ? `+91 ${parent.phone}` : 'Account')}</Text>
        <Text style={styles.userPhone}>📱 +91 {parent?.phone || '-'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Verified Account</Text>
        </View>
      </View>

      {/* Linked Students Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Enrolled Students ({kids.length})</Text>
        <Text style={styles.sectionSubtitle}>
          Students registered with mobile number {parent?.phone}
        </Text>

        <View style={styles.kidsList}>
          {kids.map((kid, idx) => (
            <View key={kid.id || kid._id || idx} style={styles.kidRow}>
              <View style={styles.kidNumberBadge}>
                <Text style={styles.kidNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.kidRowInfo}>
                <Text style={styles.kidRowName}>{kid.firstName} {kid.lastName}</Text>
                <Text style={styles.kidRowDetails}>
                  Class {kid.className || '-'}{kid.section ? ` (${kid.section})` : ''} • Adm: {kid.admissionNo}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* School Information Card */}
      <View style={styles.sectionCard}>
        <View style={styles.schoolHeaderRow}>
          <Image
            source={require('../../assets/images/logo.jpeg')}
            style={styles.schoolLogoMini}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolName}>Sharada English Medium School</Text>
            <Text style={styles.schoolMotto}>Education - the key to wisdom</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#475569" style={styles.infoIcon} />
          <Text style={styles.schoolInfoText}>Established Year: 2017</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#475569" style={styles.infoIcon} />
          <Text style={styles.schoolInfoText}>Contact Number: 8867026358</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#475569" style={styles.infoIcon} />
          <Text style={styles.schoolInfoText}>
            Address: CHERKADY, BRAHAMAVARA, UDUPI, Karnataka PIN - 576215
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#475569" style={styles.infoIcon} />
          <Text style={styles.schoolInfoText}>Office Hours: Mon - Sat (8:30 AM - 4:00 PM)</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
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
    paddingBottom: 48,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  roleBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  schoolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schoolLogoMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  schoolMotto: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  kidsList: {
    gap: 8,
  },
  kidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kidNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  kidNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  kidRowInfo: {
    flex: 1,
  },
  kidRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  kidRowDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  infoIcon: {
    marginTop: 2,
  },
  schoolInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
