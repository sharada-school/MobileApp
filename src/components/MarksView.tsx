import React, { useEffect, useState, useMemo } from 'react';
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
import { api, MarksData, ExamData, SubjectMark } from '../services/api';
import { KidSelector } from './KidSelector';
import Ionicons from '@expo/vector-icons/Ionicons';

type ViewMode = 'final' | 'register' | 'matrix' | 'byExam';

const examTypes = ['FA1', 'FA2', 'FA3', 'FA4', 'SA1', 'SA2'];

const subjectsByPart: Record<string, { 'Part A': string[]; 'Part B': string[] }> = {
  '1-5': {
    'Part A': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Environmental Studies'],
    'Part B': ['General Knowledge', 'Moral Science']
  },
  '6-8': {
    'Part A': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social'],
    'Part B': ['Computer', 'Physical Education', 'Moral Science', 'Drawing']
  },
  '9-10': {
    'Part A': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social'],
    'Part B': ['Computer', 'Physical Education', 'Moral Science', 'Drawing']
  },
  '6-10': {
    'Part A': ['English', 'Kannada', 'Hindi', 'Mathematics', 'Science', 'Social'],
    'Part B': ['Computer', 'Physical Education', 'Moral Science', 'Drawing']
  }
};

const getSubjectParts = (className?: string) => {
  const classNumber = getClassNumber(className);
  return classNumber >= 1 && classNumber <= 5 ? subjectsByPart['1-5'] : subjectsByPart['6-10'];
};

const PART_B_NAMES = [
  'computer',
  'physical education',
  'moral science',
  'drawing',
  'general knowledge'
];

const isPartBSubject = (subject?: string, part?: string) => {
  if (part === 'Part B') return true;
  if (!subject) return false;
  return PART_B_NAMES.includes(String(subject).trim().toLowerCase());
};

const getClassBand = (className?: string) => {
  const classNumber = Number.parseInt(String(className || '').match(/\d+/)?.[0] || '', 10);
  if (classNumber >= 1 && classNumber <= 5) return '1-5';
  if (classNumber >= 6 && classNumber <= 8) return '6-8';
  return '9-10';
};

const getClassNumber = (className?: string) => {
  return Number.parseInt(String(className || '').match(/\d+/)?.[0] || '', 10) || 0;
};

const getMarkRule = (className: string, examType: string, subject: string = '') => {
  const band = getClassBand(className);
  if (examType?.startsWith('FA')) {
    return { maxScore: 25, convertedMaxScore: band === '6-8' ? 10 : 15 };
  }
  if (examType?.startsWith('SA')) {
    const convertedMaxScore = band === '6-8' ? 30 : 20;
    return {
      maxScore: band === '9-10' && subject.toLowerCase() === 'english' ? 100 : band === '9-10' ? 80 : 40,
      convertedMaxScore
    };
  }
  return { maxScore: 25, convertedMaxScore: 15 };
};

const getConvertedMark = (mark: any, className: string) => {
  if (mark?.convertedScore !== undefined && mark?.convertedScore !== null) return Number(mark.convertedScore);
  const rule = getMarkRule(className, mark?.examType || '', mark?.subject || '');
  return Math.round((Number(mark?.score || 0) / Math.max(Number(mark?.maxScore || rule.maxScore), 1)) * rule.convertedMaxScore * 100) / 100;
};

const getRegisterConvertedMark = (mark: any, className: string) => {
  if (mark && Object.prototype.hasOwnProperty.call(mark, 'convertedScore') && mark.convertedScore !== null && mark.convertedScore !== undefined) {
    return Number(mark.convertedScore || 0);
  }
  return getConvertedMark(mark, className);
};

const getRegisterExamValue = (marks: any[], examType: string, className: string) => {
  return marks
    .filter((mark) => mark.examType === examType)
    .reduce((sum, mark) => sum + getRegisterConvertedMark(mark, className), 0);
};

const getRegisterGrade = (total: number, maximum: number, className: string) => {
  const classNumber = getClassNumber(className);
  if (maximum === 50) {
    if (total >= 45) return 'A+';
    if (total >= 35) return 'A';
    if (total >= 25) return 'B+';
    if (total >= 15) return 'B';
    if (total >= 0) return 'C';
    return '-';
  }
  if (classNumber >= 9 && classNumber <= 10) {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C+';
    if (total >= 33) return 'C';
    if (total >= 0) return 'NC';
    return '-';
  }
  if (classNumber < 1 || classNumber > 8) return '-';
  if (total >= 90) return 'A+';
  if (total >= 70) return 'A';
  if (total >= 50) return 'B+';
  if (total >= 30) return 'B';
  if (total >= 0) return 'C';
  return '-';
};

const getFinalGrade = (total: number, maximum: number = 500) => {
  const percentage = (Number(total || 0) / Math.max(Number(maximum || 500), 1)) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return '-';
};

const getGradeColor = (grade: string) => {
  if (!grade || grade === '-') return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' };
  if (grade.startsWith('A')) return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
  if (grade.startsWith('B')) return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
  if (grade.startsWith('C')) return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
  return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
};

export const MarksView: React.FC = () => {
  const { activeKid } = useParent();
  const [data, setData] = useState<MarksData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('final');
  const [selectedExamType, setSelectedExamType] = useState<string>('SA2');
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(null);

  const loadMarks = async (year?: string, classToFetch?: string) => {
    if (!activeKid) return;
    const studentId = activeKid.id || activeKid._id;
    if (!studentId) return;

    try {
      const res = await api.getMarks(studentId, year, classToFetch);
      setData(res);
      if (res.exams && res.exams.length > 0) {
        if (!selectedExamType || !res.exams.find((e) => e.examType === selectedExamType)) {
          const sa2Exists = res.exams.find((e) => e.examType === 'SA2');
          setSelectedExamType(sa2Exists ? 'SA2' : res.exams[0].examType);
        }
      }
    } catch (err) {
      console.error('Failed to load marks:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setSelectedSessionKey(null);
    setIsLoading(true);
    loadMarks();
  }, [activeKid]);

  const onRefresh = () => {
    setRefreshing(true);
    const parts = selectedSessionKey ? selectedSessionKey.split('::') : [];
    loadMarks(parts[1], parts[0]);
  };

  const handleSelectSession = (session: { className: string; academicYear: string }) => {
    const key = `${session.className}::${session.academicYear}`;
    setSelectedSessionKey(key);
    setIsLoading(true);
    loadMarks(session.academicYear, session.className);
  };

  const effectiveClass = data?.selectedClass || activeKid?.className || '';
  const displayYear = data?.selectedAcademicYear || activeKid?.academicYear || '2024-2025';
  const availableSessions = data?.availableSessions || [];

  // Extract all marks from payload
  const rawMarks = useMemo(() => {
    if (data?.allMarks && data.allMarks.length > 0) return data.allMarks;
    if (data?.exams) {
      return data.exams.flatMap((e) => (e.subjects || []).map((s) => ({ ...s, examType: e.examType })));
    }
    return [];
  }, [data]);

  // Exclude Part B subjects from all scholastic calculations & final results
  const allMarks = useMemo(() => {
    return rawMarks.filter((m: any) => !isPartBSubject(m.subject, m.part));
  }, [rawMarks]);

  // Keep Part B subjects separately for co-curricular display only
  const partBMarks = useMemo(() => {
    return rawMarks.filter((m: any) => isPartBSubject(m.subject, m.part));
  }, [rawMarks]);

  // 1. Final Marks calculation (Matches Web's FinalMarksTable - Part A only)
  const finalMarks = useMemo(() => {
    const classNumber = getClassNumber(effectiveClass);
    const band = getClassBand(effectiveClass);
    const subjects = getSubjectParts(effectiveClass)['Part A'];

    const rows = subjects.map((subject) => {
      const subjectMarks = allMarks.filter((m: any) => m.subject === subject);

      if (classNumber >= 9 && classNumber <= 10) {
        const sa2 = subjectMarks.find((m: any) => m.examType === 'SA2');
        const sa2Score = Number(sa2?.score || 0);
        const isEnglish = subject.toLowerCase() === 'english';
        const rawMax = Number(sa2?.maxScore) || (isEnglish ? 100 : 80);
        const convertedMax = rawMax === 100 || isEnglish ? 125 : 100;
        const convertedScore = sa2
          ? Math.min(Math.round(((sa2Score / (rawMax || (convertedMax === 125 ? 100 : 80))) * convertedMax) * 100) / 100, convertedMax)
          : 0;
        return {
          subject,
          score: convertedScore,
          maxScore: convertedMax,
          rawScore: sa2Score,
          rawMax,
          breakdownText: `SA2: ${convertedScore}`,
          hasMark: !!sa2
        };
      } else {
        const sa1 = subjectMarks.find((m: any) => m.examType === 'SA1');
        const sa2 = subjectMarks.find((m: any) => m.examType === 'SA2');
        const sa1Score = Number(sa1?.score || 0);
        const oralSa1 = Number(sa1?.oralScore || 0);
        const sa2Score = Number(sa2?.score || 0);
        const oralSa2 = Number(sa2?.oralScore || 0);
        const total = Math.min(sa1Score + oralSa1 + sa2Score + oralSa2, 100);
        return {
          subject,
          score: total,
          maxScore: 100,
          rawScore: total,
          rawMax: 100,
          breakdownText: `SA1: ${sa1Score} + Oral: ${oralSa1} + SA2: ${sa2Score} + Oral: ${oralSa2}`,
          hasMark: !!(sa1 || sa2)
        };
      }
    });

    const totalScore = Math.round(rows.reduce((sum, r) => sum + r.score, 0) * 100) / 100;
    const maximumScore = classNumber >= 9 && classNumber <= 10 ? 625 : (classNumber >= 6 && classNumber <= 8 ? 600 : 500);
    const percentage = Math.round((totalScore / maximumScore) * 100 * 10) / 10;
    const grade = getFinalGrade(totalScore, maximumScore);

    const description = band === '1-5'
      ? 'Each subject: SA1 + Oral marks = 50, SA2 + Oral marks = 50 · Total subjects: 5 · Total marks: 500 (Part B subjects excluded)'
      : band === '6-8'
        ? 'Each subject: SA1 + Oral marks = 50, SA2 + Oral marks = 50 · Total subjects: 6 · Total marks: 600 (Part B subjects excluded)'
        : 'English total marks: 125 (converted from 100) · Other subjects: 100 (converted from 80) · Calculation: SA2 · Total subjects: 6 · Total marks: 625 (Part B subjects excluded)';

    return {
      rows,
      totalScore,
      maximumScore,
      percentage,
      grade,
      description,
      band,
      classNumber
    };
  }, [allMarks, effectiveClass]);

  // 2. Marks Register calculation (Matches Web's MarksRegister - Part A only)
  const registerRows = useMemo(() => {
    const scholasticSubjects = getSubjectParts(effectiveClass)['Part A'];

    return scholasticSubjects.map((subject) => {
      const subjectMarks = allMarks.filter((m: any) => m.subject === subject);
      const values = ['FA1', 'FA2', 'SA1', 'FA3', 'FA4', 'SA2'].reduce((result: Record<string, number>, exam) => {
        result[exam] = getRegisterExamValue(subjectMarks, exam, effectiveClass);
        return result;
      }, {});
      const firstTotal = values.FA1 + values.FA2 + values.SA1;
      const secondTotal = values.FA3 + values.FA4 + values.SA2;
      const oralSa1Total = subjectMarks.filter((m: any) => m.examType === 'SA1').reduce((sum: number, m: any) => sum + Number(m.oralScore || 0), 0);
      const oralSa2Total = subjectMarks.filter((m: any) => m.examType === 'SA2').reduce((sum: number, m: any) => sum + Number(m.oralScore || 0), 0);
      const total = firstTotal + secondTotal;

      return {
        subject,
        values,
        firstTotal,
        secondTotal,
        oralSa1Total,
        oralSa2Total,
        total,
        firstGrade: getRegisterGrade(firstTotal, 50, effectiveClass),
        secondGrade: getRegisterGrade(secondTotal, 50, effectiveClass),
        totalGrade: getRegisterGrade(total, 100, effectiveClass)
      };
    });
  }, [allMarks, effectiveClass]);

  // 3. Academic Matrix (Matches Web's StudentDetail - Part A only)
  const matrixRows = useMemo(() => {
    const scholasticSubjects = getSubjectParts(effectiveClass)['Part A'];

    return scholasticSubjects.map((subject) => {
      const subjectMarks = allMarks.filter((m: any) => m.subject === subject);
      const findMark = (examType: string) => subjectMarks.find((m: any) => m.examType === examType);
      const value = (examType: string) => getConvertedMark(findMark(examType) || { examType, score: 0 }, effectiveClass);
      const oral = (examType: string) => Number(findMark(examType)?.oralScore || 0);

      const values = {
        fa1: value('FA1'),
        fa2: value('FA2'),
        sa1: value('SA1'),
        oralSa1: oral('SA1'),
        fa3: value('FA3'),
        fa4: value('FA4'),
        sa2: value('SA2'),
        oralSa2: oral('SA2')
      };
      const finalScore = Math.round(Object.values(values).reduce((sum, v) => sum + v, 0) * 100) / 100;
      const finalGrade = getRegisterGrade(Math.round((finalScore / 100) * 100), 100, effectiveClass);

      return {
        subject,
        ...values,
        finalScore,
        finalGrade
      };
    });
  }, [allMarks, effectiveClass]);

  // 4. By Exam data (Excluding Part B from numeric totals & percentages)
  const exams = useMemo(() => {
    return (data?.exams || []).map((exam) => {
      const scholasticSubjects = (exam.subjects || []).filter((s) => !isPartBSubject(s.subject, s.part));
      const partBSubjects = (exam.subjects || []).filter((s) => isPartBSubject(s.subject, s.part));
      const totalScore = scholasticSubjects.reduce((sum, s) => sum + Number(s.score || 0), 0);
      const totalMaxScore = scholasticSubjects.reduce((sum, s) => sum + Number(s.maxScore || 0), 0);
      const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      const overallGrade = getFinalGrade(totalScore, totalMaxScore);

      return {
        ...exam,
        subjects: scholasticSubjects,
        partBSubjects,
        totalScore,
        totalMaxScore,
        percentage,
        overallGrade: overallGrade !== '-' ? overallGrade : exam.overallGrade
      };
    });
  }, [data?.exams]);

  const currentExam = exams.find((e) => e.examType === selectedExamType) || exams[0];

  if (!activeKid) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No student selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Child Switcher */}
      <KidSelector />

      {/* Header Banner */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderLeft}>
          <Text style={styles.eyebrow}>ACADEMIC RECORDS • {displayYear}</Text>
          <Text style={styles.pageTitle}>Marks & Results</Text>
          <Text style={styles.pageSubtitle}>
            Class {effectiveClass || '-'} • Roll {activeKid.rollNumber || '-'} • Adm {activeKid.admissionNo || '-'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {getClassBand(effectiveClass) === '9-10' ? 'Class 9-10 (625)' : getClassBand(effectiveClass) === '6-8' ? 'Class 6-8 (600)' : 'Class 1-5 (500)'}
          </Text>
        </View>
      </View>

      {/* Academic Session Switcher (if multiple years / classes available) */}
      {availableSessions.length > 1 && (
        <View style={styles.sessionSwitcherContainer}>
          <Text style={styles.sessionSwitcherTitle}>Academic Sessions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionPillsScroll}>
            {availableSessions.map((session) => {
              const isSelected = (session.className === effectiveClass && session.academicYear === displayYear);
              return (
                <TouchableOpacity
                  key={`${session.className}-${session.academicYear}`}
                  style={[styles.sessionPill, isSelected && styles.sessionPillActive]}
                  onPress={() => handleSelectSession(session)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={session.isCurrent ? 'school' : 'time-outline'}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#2563EB'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.sessionPillText, isSelected && styles.sessionPillTextActive]}>
                    Class {session.className} ({session.academicYear})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Hero Result Banner (Web Final Marks Summary Card) */}
      <View style={styles.finalHeroCard}>
        <View style={styles.finalHeroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.finalHeroEyebrow}>ANNUAL ASSESSMENT RESULT</Text>
            <Text style={styles.finalHeroStudentName}>{activeKid.firstName} {activeKid.lastName}</Text>
            <Text style={styles.finalHeroSub}>
              {finalMarks.description}
            </Text>
          </View>
          <View
            style={[
              styles.finalGradePill,
              {
                backgroundColor: getGradeColor(finalMarks.grade).bg,
                borderColor: getGradeColor(finalMarks.grade).border,
              },
            ]}
          >
            <Text style={[styles.finalGradePillText, { color: getGradeColor(finalMarks.grade).text }]}>
              {finalMarks.grade}
            </Text>
            <Text style={styles.finalGradeLabel}>GRADE</Text>
          </View>
        </View>

        <View style={styles.finalHeroScoreRow}>
          <View>
            <Text style={styles.finalHeroScoreNumber}>
              {finalMarks.totalScore}
              <Text style={styles.finalHeroMaxScore}> / {finalMarks.maximumScore}</Text>
            </Text>
            <Text style={styles.finalHeroScoreLabel}>Total Marks Scored (Part A)</Text>
          </View>

          <View style={styles.finalPercentageBadge}>
            <Text style={styles.finalPercentageNumber}>{finalMarks.percentage}%</Text>
            <Text style={styles.finalPercentageLabel}>Aggregate</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.heroProgressTrack}>
          <View
            style={[
              styles.heroProgressFill,
              { width: `${Math.min(finalMarks.percentage, 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Navigation View Switcher (Tabs) */}
      <View style={styles.viewModeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewModeScroll}>
          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'final' && styles.viewModeTabActive]}
            onPress={() => setViewMode('final')}
          >
            <Ionicons
              name="trophy-outline"
              size={15}
              color={viewMode === 'final' ? '#FFFFFF' : '#475569'}
            />
            <Text style={[styles.viewModeTabText, viewMode === 'final' && styles.viewModeTabTextActive]}>
              Final Results ({finalMarks.maximumScore})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'register' && styles.viewModeTabActive]}
            onPress={() => setViewMode('register')}
          >
            <Ionicons
              name="book-outline"
              size={15}
              color={viewMode === 'register' ? '#FFFFFF' : '#475569'}
            />
            <Text style={[styles.viewModeTabText, viewMode === 'register' && styles.viewModeTabTextActive]}>
              Marks Register (50+50)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'matrix' && styles.viewModeTabActive]}
            onPress={() => setViewMode('matrix')}
          >
            <Ionicons
              name="grid-outline"
              size={15}
              color={viewMode === 'matrix' ? '#FFFFFF' : '#475569'}
            />
            <Text style={[styles.viewModeTabText, viewMode === 'matrix' && styles.viewModeTabTextActive]}>
              Academic Matrix
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeTab, viewMode === 'byExam' && styles.viewModeTabActive]}
            onPress={() => setViewMode('byExam')}
          >
            <Ionicons
              name="albums-outline"
              size={15}
              color={viewMode === 'byExam' ? '#FFFFFF' : '#475569'}
            />
            <Text style={[styles.viewModeTabText, viewMode === 'byExam' && styles.viewModeTabTextActive]}>
              By Exam ({exams.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading marks records...</Text>
        </View>
      ) : allMarks.length === 0 && exams.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={42} color="#94A3B8" style={{ marginBottom: 10 }} />
          <Text style={styles.emptyBoxTitle}>No marks for Class {effectiveClass} yet</Text>
          <Text style={styles.emptyBoxDesc}>
            Academic records for {activeKid.firstName} in Class {effectiveClass} ({displayYear}) have not been published by teachers yet.
            {availableSessions.length > 1 ? '\n\nPrevious session records are available in the session switcher above.' : ''}
          </Text>
        </View>
      ) : (
        <>
          {/* TAB 1: FINAL MARKS WITH GRADE */}
          {viewMode === 'final' && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeadingWrap}>
                <View>
                  <Text style={styles.sectionEyebrow}>FINAL SUMMARY</Text>
                  <Text style={styles.sectionTitle}>Final Marks with Grade</Text>
                </View>
                <View style={styles.maxTag}>
                  <Text style={styles.maxTagText}>Total: {finalMarks.maximumScore} Marks</Text>
                </View>
              </View>

              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={18} color="#2563EB" style={{ marginRight: 8 }} />
                <Text style={styles.infoBannerText}>
                  {finalMarks.description}
                </Text>
              </View>

              {/* Subject Cards (Part A only) */}
              <View style={styles.cardsList}>
                {finalMarks.rows.map((row) => {
                  const subjectPercentage = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0;
                  const subjectGrade = getRegisterGrade(subjectPercentage, 100, effectiveClass);
                  const colors = getGradeColor(subjectGrade);

                  return (
                    <View key={row.subject} style={styles.finalSubjectCard}>
                      <View style={styles.finalSubjectTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.finalSubjectName}>{row.subject}</Text>
                          <Text style={styles.finalSubjectBreakdown}>{row.breakdownText}</Text>
                          {finalMarks.classNumber >= 9 && row.hasMark && (
                            <Text style={styles.rawHint}>
                              Raw SA2 Score: {row.rawScore} / {row.rawMax}
                            </Text>
                          )}
                        </View>

                        <View style={styles.finalSubjectRight}>
                          <Text style={styles.finalSubjectScore}>
                            {row.score} <Text style={styles.finalSubjectMax}>/ {row.maxScore}</Text>
                          </Text>
                          <View
                            style={[
                              styles.miniGradePill,
                              { backgroundColor: colors.bg, borderColor: colors.border },
                            ]}
                          >
                            <Text style={[styles.miniGradeText, { color: colors.text }]}>{subjectGrade}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.subProgressTrack}>
                        <View
                          style={[
                            styles.subProgressFill,
                            {
                              width: `${Math.min(subjectPercentage, 100)}%`,
                              backgroundColor:
                                subjectPercentage >= 80
                                  ? '#10B981'
                                  : subjectPercentage >= 60
                                  ? '#2563EB'
                                  : '#F59E0B',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Aggregate Footer Card */}
              <View style={styles.aggregateCard}>
                <View style={styles.aggregateRow}>
                  <Text style={styles.aggregateLabel}>Grand Total Marks (Part A)</Text>
                  <Text style={styles.aggregateValue}>
                    {finalMarks.totalScore} / {finalMarks.maximumScore}
                  </Text>
                </View>
                <View style={styles.aggregateRow}>
                  <Text style={styles.aggregateLabel}>Aggregate Percentage</Text>
                  <Text style={styles.aggregateValue}>{finalMarks.percentage}%</Text>
                </View>
                <View style={[styles.aggregateRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.aggregateLabel}>Final Grade</Text>
                  <View
                    style={[
                      styles.miniGradePill,
                      {
                        backgroundColor: getGradeColor(finalMarks.grade).bg,
                        borderColor: getGradeColor(finalMarks.grade).border,
                        paddingHorizontal: 12,
                        paddingVertical: 3
                      },
                    ]}
                  >
                    <Text style={[styles.miniGradeText, { color: getGradeColor(finalMarks.grade).text, fontSize: 13 }]}>
                      Grade {finalMarks.grade}
                    </Text>
                  </View>
                </View>

                <View style={styles.partBExcludedNote}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#059669" style={{ marginRight: 6, marginTop: 1 }} />
                  <Text style={styles.partBExcludedText}>
                    Part B co-curricular subjects (General Knowledge, Moral Science, Computer, Physical Education, Drawing) are excluded from the final result, total marks, and percentage.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: MARKS REGISTER */}
          {viewMode === 'register' && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeadingWrap}>
                <View>
                  <Text style={styles.sectionEyebrow}>TERM BREAKDOWN</Text>
                  <Text style={styles.sectionTitle}>Marks Register</Text>
                </View>
              </View>

              <View style={styles.infoBanner}>
                <Ionicons name="calendar" size={18} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.infoBannerText}>
                  First half year (FA1 + FA2 + SA1 = 50) · Second half year (FA3 + FA4 + SA2 = 50) · Total = 100 (Part A subjects only)
                </Text>
              </View>

              <View style={styles.cardsList}>
                {registerRows.map((row) => {
                  const totalColors = getGradeColor(row.totalGrade);
                  return (
                    <View key={row.subject} style={styles.registerCard}>
                      <View style={styles.registerCardHeader}>
                        <Text style={styles.registerSubjectName}>{row.subject}</Text>
                        <View style={styles.registerTotalGroup}>
                          <Text style={styles.registerTotalScore}>{row.total} / 100</Text>
                          <View
                            style={[
                              styles.miniGradePill,
                              { backgroundColor: totalColors.bg, borderColor: totalColors.border },
                            ]}
                          >
                            <Text style={[styles.miniGradeText, { color: totalColors.text }]}>
                              {row.totalGrade}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Half-Year Breakdown Grid */}
                      <View style={styles.termsGrid}>
                        {/* Term 1 */}
                        <View style={styles.termBox}>
                          <Text style={styles.termBoxTitle}>First Half Year (50)</Text>
                          <Text style={styles.termBoxFormula}>
                            FA1: {row.values.FA1} + FA2: {row.values.FA2} + SA1: {row.values.SA1}
                          </Text>
                          <View style={styles.termScoreRow}>
                            <Text style={styles.termScoreMain}>{row.firstTotal} / 50</Text>
                            <View
                              style={[
                                styles.miniGradePill,
                                {
                                  backgroundColor: getGradeColor(row.firstGrade).bg,
                                  borderColor: getGradeColor(row.firstGrade).border,
                                },
                              ]}
                            >
                              <Text style={[styles.miniGradeText, { color: getGradeColor(row.firstGrade).text }]}>
                                {row.firstGrade}
                              </Text>
                            </View>
                          </View>
                          {row.oralSa1Total > 0 && (
                            <Text style={styles.oralNote}>Oral SA1: {row.oralSa1Total}</Text>
                          )}
                        </View>

                        {/* Term 2 */}
                        <View style={styles.termBox}>
                          <Text style={styles.termBoxTitle}>Second Half Year (50)</Text>
                          <Text style={styles.termBoxFormula}>
                            FA3: {row.values.FA3} + FA4: {row.values.FA4} + SA2: {row.values.SA2}
                          </Text>
                          <View style={styles.termScoreRow}>
                            <Text style={styles.termScoreMain}>{row.secondTotal} / 50</Text>
                            <View
                              style={[
                                styles.miniGradePill,
                                {
                                  backgroundColor: getGradeColor(row.secondGrade).bg,
                                  borderColor: getGradeColor(row.secondGrade).border,
                                },
                              ]}
                            >
                              <Text style={[styles.miniGradeText, { color: getGradeColor(row.secondGrade).text }]}>
                                {row.secondGrade}
                              </Text>
                            </View>
                          </View>
                          {row.oralSa2Total > 0 && (
                            <Text style={styles.oralNote}>Oral SA2: {row.oralSa2Total}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* TAB 3: ACADEMIC MATRIX */}
          {viewMode === 'matrix' && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeadingWrap}>
                <View>
                  <Text style={styles.sectionEyebrow}>EXAMINATION MATRIX</Text>
                  <Text style={styles.sectionTitle}>Academic Record (Part A)</Text>
                </View>
              </View>

              <Text style={styles.tableHint}>
                Swipe horizontally to view all exams and converted marks
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
                <View style={styles.matrixTable}>
                  {/* Table Header */}
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.tableCellHeader, styles.cellSubject]}>Subject</Text>
                    <Text style={styles.tableCellHeader}>FA1</Text>
                    <Text style={styles.tableCellHeader}>FA2</Text>
                    <Text style={styles.tableCellHeader}>SA1</Text>
                    <Text style={styles.tableCellHeader}>Oral SA1</Text>
                    <Text style={styles.tableCellHeader}>FA3</Text>
                    <Text style={styles.tableCellHeader}>FA4</Text>
                    <Text style={styles.tableCellHeader}>SA2</Text>
                    <Text style={styles.tableCellHeader}>Oral SA2</Text>
                    <Text style={[styles.tableCellHeader, styles.cellHighlight]}>Final</Text>
                    <Text style={[styles.tableCellHeader, styles.cellGrade]}>Grade</Text>
                  </View>

                  {/* Table Rows (Part A only) */}
                  {matrixRows.map((row, index) => {
                    const isEven = index % 2 === 0;
                    const gradeColors = getGradeColor(row.finalGrade);
                    return (
                      <View
                        key={row.subject}
                        style={[styles.tableRow, isEven && styles.tableRowEven]}
                      >
                        <Text style={[styles.tableCell, styles.cellSubject, styles.cellBold]}>
                          {row.subject}
                        </Text>
                        <Text style={styles.tableCell}>{row.fa1 || '-'}</Text>
                        <Text style={styles.tableCell}>{row.fa2 || '-'}</Text>
                        <Text style={styles.tableCell}>{row.sa1 || '-'}</Text>
                        <Text style={styles.tableCell}>{row.oralSa1 || '-'}</Text>
                        <Text style={styles.tableCell}>{row.fa3 || '-'}</Text>
                        <Text style={styles.tableCell}>{row.fa4 || '-'}</Text>
                        <Text style={styles.tableCell}>{row.sa2 || '-'}</Text>
                        <Text style={styles.tableCell}>{row.oralSa2 || '-'}</Text>
                        <Text style={[styles.tableCell, styles.cellHighlight, styles.cellBold]}>
                          {row.finalScore}
                        </Text>
                        <View style={[styles.tableCell, styles.cellGrade]}>
                          <View
                            style={[
                              styles.miniGradePill,
                              { backgroundColor: gradeColors.bg, borderColor: gradeColors.border },
                            ]}
                          >
                            <Text style={[styles.miniGradeText, { color: gradeColors.text }]}>
                              {row.finalGrade}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Part B Co-Curricular Section (Grades only, separate from final result) */}
              {partBMarks.length > 0 && (
                <View style={styles.partBSection}>
                  <Text style={styles.partBSectionTitle}>Co-Curricular Grades (Part B)</Text>
                  <Text style={styles.partBSectionSub}>
                    Grades only • Excluded from final result and total marks
                  </Text>
                  <View style={styles.partBGrid}>
                    {Array.from(new Set(partBMarks.map((m: any) => m.subject).filter(Boolean))).map((subject) => {
                      const subMarks = partBMarks.filter((m: any) => m.subject === subject);
                      const latestGrade = subMarks[subMarks.length - 1]?.grade || '-';
                      return (
                        <View key={subject} style={styles.partBCard}>
                          <Text style={styles.partBName}>{subject}</Text>
                          <View style={[styles.miniGradePill, { backgroundColor: getGradeColor(latestGrade).bg, borderColor: getGradeColor(latestGrade).border }]}>
                            <Text style={[styles.miniGradeText, { color: getGradeColor(latestGrade).text }]}>Grade {latestGrade}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: BY EXAMINATION */}
          {viewMode === 'byExam' && (
            <View style={styles.sectionContainer}>
              {/* Exam Tabs */}
              <View style={styles.examTabsSection}>
                <Text style={styles.sectionTitle}>Select Examination</Text>
                {exams.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examTabsRow}>
                    {exams.map((exam) => {
                      const isSelected = exam.examType === currentExam?.examType;
                      return (
                        <TouchableOpacity
                          key={exam.examType}
                          style={[styles.examTab, isSelected && styles.examTabActive]}
                          onPress={() => setSelectedExamType(exam.examType)}
                        >
                          <Text style={[styles.examTabText, isSelected && styles.examTabTextActive]}>
                            {exam.examType}
                          </Text>
                          <View
                            style={[
                              styles.examTabGrade,
                              { backgroundColor: isSelected ? '#FFFFFF' : '#E2E8F0' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.examTabGradeText,
                                { color: isSelected ? '#2563EB' : '#475569' },
                              ]}
                            >
                              {exam.overallGrade}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>

              {currentExam && (
                <>
                  <View style={styles.examSummaryCard}>
                    <View style={styles.examSummaryTop}>
                      <View>
                        <Text style={styles.examBadgeTitle}>{currentExam.examType} Assessment</Text>
                        <Text style={styles.examSubtitle}>
                          {activeKid.firstName} • Class {activeKid.className} (Part A Total)
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.overallGradeBadge,
                          {
                            backgroundColor: getGradeColor(currentExam.overallGrade).bg,
                            borderColor: getGradeColor(currentExam.overallGrade).border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.overallGradeText,
                            { color: getGradeColor(currentExam.overallGrade).text },
                          ]}
                        >
                          Grade {currentExam.overallGrade}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scoreRow}>
                      <View>
                        <Text style={styles.scoreBig}>
                          {currentExam.totalScore}
                          <Text style={styles.scoreMax}> / {currentExam.totalMaxScore}</Text>
                        </Text>
                        <Text style={styles.scoreDesc}>Exam Total Marks (Part A)</Text>
                      </View>
                      <View style={styles.percentageCircle}>
                        <Text style={styles.percentageCircleNumber}>{currentExam.percentage}%</Text>
                        <Text style={styles.percentageCircleLabel}>Aggregate</Text>
                      </View>
                    </View>

                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.min(currentExam.percentage, 100)}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Scholastic Subject List (Part A) */}
                  <View style={styles.subjectsHeader}>
                    <Text style={styles.sectionTitle}>Scholastic Subjects (Part A)</Text>
                    <Text style={styles.subjectCount}>{currentExam.subjects.length} Subjects</Text>
                  </View>

                  <View style={styles.cardsList}>
                    {currentExam.subjects.map((sub: SubjectMark, index: number) => {
                      const gradeColors = getGradeColor(sub.grade);
                      return (
                        <View key={sub.id || index} style={styles.subjectCard}>
                          <View style={styles.subjectTop}>
                            <View style={styles.subjectNameBox}>
                              <Text style={styles.subjectName}>{sub.subject}</Text>
                              {sub.teacherName ? (
                                <Text style={styles.teacherName}>Teacher: {sub.teacherName}</Text>
                              ) : null}
                            </View>

                            <View style={styles.scoreAndGrade}>
                              <Text style={styles.subjectScore}>
                                {sub.score} <Text style={styles.subjectMax}>/ {sub.maxScore}</Text>
                              </Text>
                              <View
                                style={[
                                  styles.subjectGradePill,
                                  {
                                    backgroundColor: gradeColors.bg,
                                    borderColor: gradeColors.border,
                                  },
                                ]}
                              >
                                <Text style={[styles.subjectGradeText, { color: gradeColors.text }]}>
                                  {sub.grade}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.subProgressTrack}>
                            <View
                              style={[
                                styles.subProgressFill,
                                {
                                  width: `${Math.min(sub.percentage, 100)}%`,
                                  backgroundColor:
                                    sub.percentage >= 80
                                      ? '#10B981'
                                      : sub.percentage >= 60
                                      ? '#2563EB'
                                      : '#F59E0B',
                                },
                              ]}
                            />
                          </View>

                          {(sub.oralScore !== undefined || sub.convertedScore !== undefined) ? (
                            <View style={styles.subMetaRow}>
                              {sub.oralScore !== undefined && (
                                <Text style={styles.subMetaText}>Oral: {sub.oralScore}/10</Text>
                              )}
                              {sub.convertedScore !== undefined && (
                                <Text style={styles.subMetaText}>
                                  Converted: {sub.convertedScore}
                                </Text>
                              )}
                              <Text style={[styles.subMetaText, { marginLeft: 'auto', fontWeight: '700' }]}>
                                {sub.percentage}%
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  {/* Part B Co-Curricular Subjects for this Exam */}
                  {currentExam.partBSubjects && currentExam.partBSubjects.length > 0 && (
                    <View style={styles.partBSection}>
                      <Text style={styles.partBSectionTitle}>Co-Curricular Grades (Part B)</Text>
                      <Text style={styles.partBSectionSub}>
                        Grades only • Excluded from exam total marks
                      </Text>
                      <View style={styles.partBGrid}>
                        {currentExam.partBSubjects.map((sub: any, index: number) => (
                          <View key={sub.id || index} style={styles.partBCard}>
                            <Text style={styles.partBName}>{sub.subject}</Text>
                            <View
                              style={[
                                styles.miniGradePill,
                                {
                                  backgroundColor: getGradeColor(sub.grade).bg,
                                  borderColor: getGradeColor(sub.grade).border,
                                },
                              ]}
                            >
                              <Text style={[styles.miniGradeText, { color: getGradeColor(sub.grade).text }]}>
                                Grade {sub.grade || '-'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </>
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
    paddingBottom: 50,
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
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  pageHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  finalHeroCard: {
    marginHorizontal: 16,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginTop: 6,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  finalHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  finalHeroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.2,
  },
  finalHeroStudentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  finalHeroSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 15,
  },
  finalGradePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 54,
  },
  finalGradePillText: {
    fontSize: 18,
    fontWeight: '900',
  },
  finalGradeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    marginTop: 1,
  },
  finalHeroScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  finalHeroScoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  finalHeroMaxScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
  },
  finalHeroScoreLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  finalPercentageBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  finalPercentageNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8',
  },
  finalPercentageLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  heroProgressTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  viewModeContainer: {
    marginBottom: 16,
  },
  viewModeScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  viewModeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  viewModeTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  viewModeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  viewModeTabTextActive: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionHeadingWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  maxTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  maxTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
    fontWeight: '500',
  },
  cardsList: {
    gap: 12,
  },
  finalSubjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  finalSubjectTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  finalSubjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  finalSubjectBreakdown: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  rawHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  finalSubjectRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  finalSubjectScore: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  finalSubjectMax: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  miniGradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGradeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  subProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  aggregateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 16,
    gap: 10,
  },
  aggregateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  aggregateLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  aggregateValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  partBExcludedNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 4,
  },
  partBExcludedText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
    fontWeight: '500',
  },
  registerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  registerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  registerSubjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  registerTotalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registerTotalScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  termsGrid: {
    gap: 10,
  },
  termBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  termBoxFormula: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  termScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  termScoreMain: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  oralNote: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  tableHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  tableScroll: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  matrixTable: {
    minWidth: 700,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  tableCellHeader: {
    width: 62,
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
  },
  tableRowEven: {
    backgroundColor: '#FCFDFF',
  },
  tableCell: {
    width: 62,
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
  cellSubject: {
    width: 120,
    textAlign: 'left',
    paddingLeft: 12,
  },
  cellBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  cellHighlight: {
    width: 65,
    color: '#2563EB',
    fontWeight: '800',
  },
  cellGrade: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partBSection: {
    marginTop: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  partBSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  partBSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  partBGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partBCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '47%',
    flexGrow: 1,
    gap: 8,
  },
  partBName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  examTabsSection: {
    marginBottom: 12,
  },
  examTabsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  examTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginRight: 10,
    gap: 6,
  },
  examTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  examTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  examTabTextActive: {
    color: '#FFFFFF',
  },
  examTabGrade: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  examTabGradeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  examSummaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  examSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examBadgeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  examSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  overallGradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  overallGradeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBig: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreMax: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  scoreDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  percentageCircle: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  percentageCircleNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
  },
  percentageCircleLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  subjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subjectNameBox: {
    flex: 1,
    marginRight: 10,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  teacherName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scoreAndGrade: {
    alignItems: 'flex-end',
    gap: 3,
  },
  subjectScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subjectMax: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  subjectGradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  subjectGradeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  subMetaText: {
    fontSize: 11,
    color: '#64748B',
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
    margin: 16,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    lineHeight: 18,
  },
  sessionSwitcherContainer: {
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sessionSwitcherTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sessionPillsScroll: {
    flexDirection: 'row',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sessionPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  sessionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  sessionPillTextActive: {
    color: '#FFFFFF',
  },
});
