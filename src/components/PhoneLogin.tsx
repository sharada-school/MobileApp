import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useParent } from '../context/ParentContext';
import { getApiBaseUrl, setCustomApiBaseUrl, testServerConnection } from '../services/api';

type ErrorCategory = 'unregistered' | 'invalid_format' | 'connection' | 'general';

interface ParsedErrorInfo {
  category: ErrorCategory;
  title: string;
  message: string;
  actionType?: 'call_office' | 'server_settings' | 'clear';
}

const parseErrorMessage = (errText: string, currentPhone: string): ParsedErrorInfo => {
  const lower = errText.toLowerCase();
  const cleanDigits = currentPhone.replace(/\D/g, '').slice(-10);
  const displayPhone = cleanDigits.length === 10
    ? `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`
    : cleanDigits
      ? `+91 ${cleanDigits}`
      : '';

  // 1. Unregistered / Wrong Phone Number (Not linked to any student)
  if (
    lower.includes('not registered') ||
    lower.includes('no student') ||
    lower.includes('not found') ||
    lower.includes('no records') ||
    lower.includes('wrong') ||
    lower.includes('record not found')
  ) {
    return {
      category: 'unregistered',
      title: 'Mobile Number Not Registered',
      message: displayPhone
        ? `The mobile number ${displayPhone} is not registered with any student in Sharada English Medium School records.`
        : 'This mobile number is not registered with any student in Sharada English Medium School records.',
      actionType: 'call_office'
    };
  }

  // 2. Server connection or network error
  if (
    lower.includes('unable to connect') ||
    lower.includes('network') ||
    lower.includes('connection') ||
    lower.includes('server') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('offline')
  ) {
    return {
      category: 'connection',
      title: 'School Server Connection Error',
      message:
        'Could not connect to the school backend server. Please check your internet or Wi-Fi connection, or verify the server address in Server Connection settings below.',
      actionType: 'server_settings'
    };
  }

  // 3. Format or digit validation error
  if (
    lower.includes('10-digit') ||
    lower.includes('incomplete') ||
    lower.includes('valid') ||
    lower.includes('repeating') ||
    lower.includes('required')
  ) {
    return {
      category: 'invalid_format',
      title: 'Invalid Mobile Number',
      message: errText,
      actionType: 'clear'
    };
  }

  // 4. Fallback general error
  return {
    category: 'general',
    title: 'Login Unsuccessful',
    message: errText,
    actionType: 'clear'
  };
};

export const PhoneLogin: React.FC = () => {
  const { login, isLoading, error, clearError } = useParent();
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');

  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Server connectivity state
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: ''
  });

  const activeError = localError || error;
  const parsedError = activeError ? parseErrorMessage(activeError, phone) : null;

  const handlePhoneChange = (text: string) => {
    // Restrict strictly to digits up to 10
    const cleanDigits = text.replace(/\D/g, '').slice(0, 10);
    setPhone(cleanDigits);
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const handleClearPhone = () => {
    setPhone('');
    setLocalError('');
    clearError();
    inputRef.current?.focus();
  };

  const handleLogin = async () => {
    setLocalError('');
    clearError();
    const clean = phone.replace(/\D/g, '');

    // Validation: Empty check
    if (!clean || clean.length === 0) {
      setLocalError('Please enter your 10-digit registered mobile number.');
      inputRef.current?.focus();
      return;
    }

    // Validation: Incomplete length check
    if (clean.length < 10) {
      setLocalError(
        `Incomplete mobile number: Please enter all 10 digits (you entered ${clean.length} of 10 digits).`
      );
      inputRef.current?.focus();
      return;
    }

    // Validation: Obvious repeating fake numbers (e.g. 0000000000)
    if (/^(\d)\1{9}$/.test(clean)) {
      setLocalError(
        `Please enter a valid mobile number. Repeating digits (such as ${clean}) are not valid.`
      );
      inputRef.current?.focus();
      return;
    }

    const last10 = clean.slice(-10);
    await login(last10);
  };

  const handleCallSchool = () => {
    Linking.openURL('tel:8867026358').catch(() => {
      // Fallback if dialer is not supported on web/emulator
      alert('School Office Phone: 8867026358');
    });
  };

  const handleTestServer = async (urlToTest?: string) => {
    setTestingConnection(true);
    setConnectionStatus({ type: 'idle', message: 'Testing connection...' });
    const target = urlToTest || serverUrl;
    const res = await testServerConnection(target);
    setTestingConnection(false);
    setConnectionStatus({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
  };

  const handleSaveServer = (urlToSave: string) => {
    setCustomApiBaseUrl(urlToSave);
    setServerUrl(urlToSave);
    setConnectionStatus({
      type: 'success',
      message: `Server set to ${urlToSave}`
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/school-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.schoolName}>Sharada English Medium School</Text>
          <Text style={styles.schoolMotto}>Education - the key to wisdom • Cherkady</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>Established 2017</Text>
            </View>
            <TouchableOpacity
              style={[styles.metaBadge, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
              onPress={handleCallSchool}
              activeOpacity={0.8}
            >
              <Text style={[styles.metaBadgeText, { color: '#166534' }]}>📞 8867026358</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.schoolAddress}>
            CHERKADY, BRAHAMAVARA, UDUPI, Karnataka PIN - 576215
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.inputLabel}>Parent Mobile Number</Text>
            {phone.length > 0 && (
              <View
                style={[
                  styles.digitBadge,
                  phone.length === 10 ? styles.digitBadgeComplete : styles.digitBadgeIncomplete,
                  Boolean(activeError) && styles.digitBadgeError
                ]}
              >
                <Text
                  style={[
                    styles.digitBadgeText,
                    phone.length === 10 && styles.digitBadgeTextComplete,
                    Boolean(activeError) && styles.digitBadgeTextError
                  ]}
                >
                  {phone.length === 10 ? '✓ 10/10 digits' : `${phone.length}/10 digits`}
                </Text>
              </View>
            )}
          </View>

          {/* Input Row with Error Styling */}
          <View
            style={[
              styles.phoneInputRow,
              Boolean(activeError) && styles.phoneInputRowError
            ]}
          >
            <View
              style={[
                styles.countryCodeBox,
                Boolean(activeError) && styles.countryCodeBoxError
              ]}
            >
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>

            <TextInput
              ref={inputRef}
              style={[
                styles.phoneInput,
                Boolean(activeError) && styles.phoneInputError
              ]}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={handlePhoneChange}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {phone.length > 0 && (
              <TouchableOpacity
                style={styles.inputClearBtn}
                onPress={handleClearPhone}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Helper preview / guide text */}
          <View style={styles.helperRow}>
            {phone.length > 0 ? (
              <Text style={styles.helperPreviewText}>
                Logging in as: <Text style={styles.helperPreviewBold}>+91 {phone.length > 5 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone}</Text>
              </Text>
            ) : (
              <Text style={styles.helperDefaultText}>
                Enter your 10-digit number registered during admission
              </Text>
            )}
          </View>

          {/* USER-FRIENDLY ERROR PRESENTATION CARD */}
          {parsedError && (
            <View
              style={[
                styles.errorCard,
                parsedError.category === 'unregistered' && styles.errorCardUnregistered,
                parsedError.category === 'connection' && styles.errorCardConnection,
                parsedError.category === 'invalid_format' && styles.errorCardInvalid,
              ]}
            >
              <View style={styles.errorCardHeader}>
                <View
                  style={[
                    styles.errorIconBox,
                    parsedError.category === 'connection' && styles.errorIconBoxConnection,
                    parsedError.category === 'unregistered' && styles.errorIconBoxUnregistered,
                  ]}
                >
                  <Ionicons
                    name={
                      parsedError.category === 'unregistered'
                        ? 'alert-circle'
                        : parsedError.category === 'connection'
                          ? 'cloud-offline-outline'
                          : 'warning-outline'
                    }
                    size={22}
                    color={
                      parsedError.category === 'connection'
                        ? '#D97706'
                        : '#DC2626'
                    }
                  />
                </View>

                <View style={styles.errorTitleWrapper}>
                  <Text
                    style={[
                      styles.errorCardTitle,
                      parsedError.category === 'connection' && { color: '#B45309' }
                    ]}
                  >
                    {parsedError.title}
                  </Text>
                  <Text style={styles.errorCardMessage}>{parsedError.message}</Text>
                </View>
              </View>

              {/* Specific Help & Actions for Unregistered / Wrong Number */}
              {parsedError.category === 'unregistered' && (
                <View style={styles.unregisteredHelpBox}>
                  <Text style={styles.unregisteredHelpTitle}>How to resolve:</Text>
                  <View style={styles.unregisteredHelpItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#DC2626" style={{ marginTop: 2 }} />
                    <Text style={styles.unregisteredHelpText}>
                      Check for any typing mistakes in the 10-digit number.
                    </Text>
                  </View>
                  <View style={styles.unregisteredHelpItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#DC2626" style={{ marginTop: 2 }} />
                    <Text style={styles.unregisteredHelpText}>
                      Ensure you are using the primary parent contact number registered in school admission records.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.callOfficeBtn}
                    onPress={handleCallSchool}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.callOfficeBtnText}>Call School Office: 8867026358</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Button for Server Connection Errors */}
              {parsedError.category === 'connection' && (
                <TouchableOpacity
                  style={styles.configureServerBtn}
                  onPress={() => {
                    setShowServerSettings(true);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="settings-outline" size={16} color="#B45309" />
                  <Text style={styles.configureServerBtnText}>
                    Open Server Connection Settings
                  </Text>
                </TouchableOpacity>
              )}

              {/* Clear & Retype action */}
              <TouchableOpacity
                style={styles.retryActionBtn}
                onPress={handleClearPhone}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={15} color="#64748B" />
                <Text style={styles.retryActionBtnText}>Clear and enter different number</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Normal Info Note (Hidden when an error is actively displayed) */}
          {!parsedError && (
            <View style={styles.autoCreateNote}>
              <Text style={styles.autoCreateNoteIcon}>ℹ️</Text>
              <Text style={styles.autoCreateNoteText}>
                Enter your registered mobile number to view attendance, exam marks, and academic progress.
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            disabled={isLoading}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitButtonText}>Verifying Mobile Number...</Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <Text style={styles.submitButtonText}>Continue to Portal</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Demo Fill Helper (for easy testing with sample student account) */}
          <View style={styles.demoHelperBox}>
            <Text style={styles.demoHelperLabel}>Registered Test Account:</Text>
            <TouchableOpacity
              style={styles.demoHelperPill}
              onPress={() => {
                setPhone('1234567890');
                setLocalError('');
                clearError();
              }}
            >
              <Ionicons name="key-outline" size={12} color="#3730A3" />
              <Text style={styles.demoHelperPillText}>Fill Demo Number: 1234567890</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server Connection Settings (Collapsible) */}
        <View style={styles.serverSection}>
          <TouchableOpacity
            style={styles.serverToggle}
            onPress={() => setShowServerSettings(!showServerSettings)}
            activeOpacity={0.8}
          >
            <View style={styles.serverToggleLeft}>
              <Text style={styles.serverToggleIcon}>⚙️</Text>
              <View>
                <Text style={styles.serverToggleTitle}>Server Connection</Text>
                <Text style={styles.serverToggleSub}>{serverUrl}</Text>
              </View>
            </View>
            <Text style={styles.serverToggleArrow}>{showServerSettings ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showServerSettings && (
            <View style={styles.serverCard}>
              <Text style={styles.serverCardLabel}>School Portal Backend API URL</Text>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="https://portal.sharada-school.co.in"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.quickPresetRow}>
                <TouchableOpacity
                  style={[
                    styles.quickPresetBtn,
                    serverUrl === 'https://portal.sharada-school.co.in' && { backgroundColor: '#DBEAFE', borderColor: '#2563EB' }
                  ]}
                  onPress={() => {
                    const u = 'https://portal.sharada-school.co.in';
                    setServerUrl(u);
                    handleSaveServer(u);
                  }}
                >
                  <Text style={[
                    styles.quickPresetText,
                    serverUrl === 'https://portal.sharada-school.co.in' && { color: '#1D4ED8', fontWeight: '700' }
                  ]}>Sharada Portal (Live)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickPresetBtn}
                  onPress={() => {
                    const u = 'http://10.0.2.2:4000';
                    setServerUrl(u);
                    handleSaveServer(u);
                  }}
                >
                  <Text style={styles.quickPresetText}>Local Emulator</Text>
                </TouchableOpacity>
              </View>

              {connectionStatus.message ? (
                <View
                  style={[
                    styles.connectionStatusBox,
                    connectionStatus.type === 'success' && styles.connectionStatusSuccess,
                    connectionStatus.type === 'error' && styles.connectionStatusError,
                  ]}
                >
                  <Text
                    style={[
                      styles.connectionStatusText,
                      connectionStatus.type === 'success' && { color: '#059669' },
                      connectionStatus.type === 'error' && { color: '#DC2626' },
                    ]}
                  >
                    {connectionStatus.type === 'success' ? '✓ ' : '✗ '}
                    {connectionStatus.message}
                  </Text>
                </View>
              ) : null}

              <View style={styles.serverActionRow}>
                <TouchableOpacity
                  style={styles.pingButton}
                  onPress={() => handleTestServer()}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <Text style={styles.pingButtonText}>Test Ping</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveServerBtn}
                  onPress={() => handleSaveServer(serverUrl)}
                >
                  <Text style={styles.saveServerBtnText}>Save Server</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 36,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
    maxWidth: 440,
    width: '100%',
  },
  logoWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  schoolName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  schoolMotto: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  schoolAddress: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  digitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  digitBadgeIncomplete: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  digitBadgeComplete: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  digitBadgeError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  digitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  digitBadgeTextComplete: {
    color: '#059669',
  },
  digitBadgeTextError: {
    color: '#DC2626',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  phoneInputRowError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  countryCodeBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    justifyContent: 'center',
  },
  countryCodeBoxError: {
    backgroundColor: '#FEE2E2',
    borderRightColor: '#FECACA',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  phoneInputError: {
    color: '#991B1B',
  },
  inputClearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  helperDefaultText: {
    fontSize: 11,
    color: '#64748B',
  },
  helperPreviewText: {
    fontSize: 11,
    color: '#334155',
  },
  helperPreviewBold: {
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Enhanced User-Friendly Error Card */
  errorCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorCardUnregistered: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
  },
  errorCardConnection: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  errorCardInvalid: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  errorIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconBoxUnregistered: {
    backgroundColor: '#FED7D7',
  },
  errorIconBoxConnection: {
    backgroundColor: '#FEF3C7',
  },
  errorTitleWrapper: {
    flex: 1,
  },
  errorCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: -0.2,
  },
  errorCardMessage: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 3,
    lineHeight: 17,
  },
  unregisteredHelpBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    gap: 6,
  },
  unregisteredHelpTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  unregisteredHelpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  unregisteredHelpText: {
    flex: 1,
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 15,
  },
  callOfficeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  callOfficeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  configureServerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: 10,
  },
  configureServerBtnText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  retryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 5,
  },
  retryActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  autoCreateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  autoCreateNoteIcon: {
    fontSize: 14,
  },
  autoCreateNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  demoHelperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoHelperLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  demoHelperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  demoHelperPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730A3',
  },

  /* Server settings section */
  serverSection: {
    width: '100%',
    maxWidth: 440,
    marginTop: 20,
    marginBottom: 40,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serverToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  serverToggleIcon: {
    fontSize: 18,
  },
  serverToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  serverToggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  serverToggleArrow: {
    fontSize: 12,
    color: '#64748B',
    paddingLeft: 8,
  },
  serverCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E2E8F0',
  },
  serverCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  serverInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickPresetBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickPresetText: {
    fontSize: 11,
    color: '#3730A3',
    fontWeight: '600',
  },
  connectionStatusBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectionStatusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  connectionStatusError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  connectionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  serverActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  pingButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pingButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  saveServerBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveServerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
