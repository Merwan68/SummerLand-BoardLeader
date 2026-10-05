import {
  Student,
  Teacher,
  ClassRoom,
  Subject,
  StudentAttendanceRecord,
  TeacherAttendanceRecord,
  Assessment,
  Mark,
  SchoolTarget,
  SchoolIssue,
  SchoolConfig,
  SchoolStatusCalculation,
  GradingRule
} from '../types';

/**
 * Calculates Student Attendance Percentage:
 * (Present Days + Late count*0.5 if desired, or pure Present/Total Recorded)
 * The prompt states: "Attendance % = Present Days / Total Recorded Days × 100. Clearly handle days that are not recorded. Never treat unrecorded days as absent."
 */
export function calculateStudentAttendancePercentage(records: StudentAttendanceRecord[]): number | null {
  if (!records || records.length === 0) return null;
  
  // Total recorded days
  const totalRecorded = records.length;
  if (totalRecorded === 0) return null;
  
  const presentCount = records.filter(r => r.status === 'present').length;
  // Late is usually present with note, or we can count present. Strict formula: Present / Total Recorded * 100
  // If late or excused are considered attended, let's treat 'present' as 1, 'late' as 0.8, or strictly r.status === 'present':
  // Following prompt: Attendance % = Present Days / Total Recorded Days × 100
  const percentage = (presentCount / totalRecorded) * 100;
  return Math.round(percentage * 10) / 10;
}

/**
 * Calculates Teacher Attendance Percentage
 */
export function calculateTeacherAttendancePercentage(records: TeacherAttendanceRecord[]): number | null {
  if (!records || records.length === 0) return null;
  const totalRecorded = records.length;
  if (totalRecorded === 0) return null;
  
  const presentCount = records.filter(r => r.status === 'present').length;
  const percentage = (presentCount / totalRecorded) * 100;
  return Math.round(percentage * 10) / 10;
}

/**
 * Calculates Overall Academic Performance Average %
 * Each mark has score and its assessment has max_score. Normalized to 0-100%.
 */
export function calculateAcademicAverage(marks: Mark[], assessments: Assessment[]): number | null {
  if (!marks || marks.length === 0 || !assessments || assessments.length === 0) return null;
  
  const assessmentMap = new Map<string, Assessment>();
  assessments.forEach(a => assessmentMap.set(a.id, a));
  
  let totalNormalizedScore = 0;
  let count = 0;
  
  marks.forEach(m => {
    const assessment = assessmentMap.get(m.assessment_id);
    if (assessment && assessment.max_score > 0) {
      const normalized = (m.score / assessment.max_score) * 100;
      totalNormalizedScore += normalized;
      count++;
    }
  });
  
  if (count === 0) return null;
  return Math.round((totalNormalizedScore / count) * 10) / 10;
}

/**
 * Calculates Pass Rate % based on school pass_mark threshold (e.g. 50%)
 */
export function calculatePassRate(marks: Mark[], assessments: Assessment[], passMark: number = 50): number | null {
  if (!marks || marks.length === 0 || !assessments || assessments.length === 0) return null;
  
  const assessmentMap = new Map<string, Assessment>();
  assessments.forEach(a => assessmentMap.set(a.id, a));
  
  let passedCount = 0;
  let totalCount = 0;
  
  marks.forEach(m => {
    const assessment = assessmentMap.get(m.assessment_id);
    if (assessment && assessment.max_score > 0) {
      const percentage = (m.score / assessment.max_score) * 100;
      if (percentage >= passMark) {
        passedCount++;
      }
      totalCount++;
    }
  });
  
  if (totalCount === 0) return null;
  return Math.round((passedCount / totalCount) * 1000) / 10;
}

/**
 * Get Grade Letter from score percentage using configured grading rules
 */
export function getGradeLetter(scorePercentage: number, rules: GradingRule[]): { grade: string; description: string } {
  const sortedRules = [...rules].sort((a, b) => b.min_score - a.min_score);
  for (const rule of sortedRules) {
    if (scorePercentage >= rule.min_score && scorePercentage <= rule.max_score) {
      return { grade: rule.grade, description: rule.description };
    }
  }
  return { grade: 'F', description: 'Fail' };
}

/**
 * Calculate Target Achievement %
 */
export function calculateTargetAchievement(target: SchoolTarget, currentValue: number | null): number | null {
  if (currentValue === null || target.target_value <= 0) return null;
  const achievement = (currentValue / target.target_value) * 100;
  return Math.round(achievement * 10) / 10;
}

/**
 * Comprehensive Overall School Status Calculation
 * Evaluates:
 * 1. Student Attendance vs threshold
 * 2. Teacher Attendance vs threshold
 * 3. Academic Performance vs threshold
 * 4. Pass Rate vs threshold
 * 5. Target Achievement average
 * 6. Critical Open Issues (instant alert/penalty)
 */
export function computeSchoolStatus(params: {
  config: SchoolConfig;
  studentAttendance: StudentAttendanceRecord[];
  teacherAttendance: TeacherAttendanceRecord[];
  marks: Mark[];
  assessments: Assessment[];
  targets: SchoolTarget[];
  issues: SchoolIssue[];
}): SchoolStatusCalculation {
  const { config, studentAttendance, teacherAttendance, marks, assessments, targets, issues } = params;
  
  const studentAttPct = calculateStudentAttendancePercentage(studentAttendance);
  const teacherAttPct = calculateTeacherAttendancePercentage(teacherAttendance);
  const academicAvg = calculateAcademicAverage(marks, assessments);
  const passRate = calculatePassRate(marks, assessments, config.thresholds.pass_mark);
  
  // Open critical issues
  const openCriticalIssues = issues.filter(
    i => i.status !== 'Resolved' && i.priority === 'Critical'
  );
  
  // Targets average achievement
  let targetsAvgPct: number | null = null;
  if (targets.length > 0) {
    const activeTargets = targets.filter(t => t.status === 'in_progress' || t.status === 'achieved');
    if (activeTargets.length > 0) {
      let sumAchieved = 0;
      let targetCount = 0;
      activeTargets.forEach(t => {
        let currentMetric: number | null = null;
        if (t.indicator === 'student_attendance') currentMetric = studentAttPct;
        else if (t.indicator === 'teacher_attendance') currentMetric = teacherAttPct;
        else if (t.indicator === 'academic_performance') currentMetric = academicAvg;
        else if (t.indicator === 'pass_rate') currentMetric = passRate;
        
        if (currentMetric !== null) {
          const ach = Math.min(120, (currentMetric / t.target_value) * 100);
          sumAchieved += ach;
          targetCount++;
        }
      });
      if (targetCount > 0) {
        targetsAvgPct = Math.round((sumAchieved / targetCount) * 10) / 10;
      }
    }
  }

  // Weightings
  let weightedSum = 0;
  let weightAvailable = 0;
  
  const factors: string[] = [];

  // 1. Student Attendance
  let studAttStatus: 'good' | 'warning' | 'critical' | 'none' = 'none';
  if (studentAttPct !== null) {
    weightAvailable += config.status_weights.student_attendance;
    weightedSum += (studentAttPct / 100) * config.status_weights.student_attendance;
    if (studentAttPct >= config.thresholds.attendance_good) studAttStatus = 'good';
    else if (studentAttPct >= config.thresholds.attendance_warning) {
      studAttStatus = 'warning';
      factors.push(`Student attendance (${studentAttPct}%) below target`);
    } else {
      studAttStatus = 'critical';
      factors.push(`Critical student attendance rate (${studentAttPct}%)`);
    }
  }

  // 2. Teacher Attendance
  let teachAttStatus: 'good' | 'warning' | 'critical' | 'none' = 'none';
  if (teacherAttPct !== null) {
    weightAvailable += config.status_weights.teacher_attendance;
    weightedSum += (teacherAttPct / 100) * config.status_weights.teacher_attendance;
    if (teacherAttPct >= config.thresholds.attendance_good) teachAttStatus = 'good';
    else if (teacherAttPct >= config.thresholds.attendance_warning) {
      teachAttStatus = 'warning';
      factors.push(`Teacher attendance (${teacherAttPct}%) needs monitoring`);
    } else {
      teachAttStatus = 'critical';
      factors.push(`Low teacher attendance (${teacherAttPct}%)`);
    }
  }

  // 3. Academic Performance
  let academicStatus: 'good' | 'warning' | 'critical' | 'none' = 'none';
  if (academicAvg !== null) {
    weightAvailable += config.status_weights.academic_performance;
    weightedSum += (academicAvg / 100) * config.status_weights.academic_performance;
    if (academicAvg >= config.thresholds.academic_good) academicStatus = 'good';
    else if (academicAvg >= config.thresholds.academic_warning) {
      academicStatus = 'warning';
      factors.push(`Academic average (${academicAvg}%) in warning zone`);
    } else {
      academicStatus = 'critical';
      factors.push(`Low overall academic performance (${academicAvg}%)`);
    }
  }

  // 4. Pass Rate
  let passRateStatus: 'good' | 'warning' | 'critical' | 'none' = 'none';
  if (passRate !== null) {
    weightAvailable += config.status_weights.pass_rate;
    weightedSum += (passRate / 100) * config.status_weights.pass_rate;
    if (passRate >= 80) passRateStatus = 'good';
    else if (passRate >= 65) {
      passRateStatus = 'warning';
      factors.push(`Pass rate (${passRate}%) needs improvement`);
    } else {
      passRateStatus = 'critical';
      factors.push(`Pass rate dropped to (${passRate}%)`);
    }
  }

  // 5. Targets
  let targetsStatus: 'good' | 'warning' | 'critical' | 'none' = 'none';
  if (targetsAvgPct !== null) {
    weightAvailable += config.status_weights.targets;
    const targetScorePct = Math.min(100, targetsAvgPct);
    weightedSum += (targetScorePct / 100) * config.status_weights.targets;
    if (targetsAvgPct >= 95) targetsStatus = 'good';
    else if (targetsAvgPct >= 75) targetsStatus = 'warning';
    else targetsStatus = 'critical';
  }

  // Normalized overall score (0 - 100)
  const normalizedScore = weightAvailable > 0
    ? Math.round((weightedSum / weightAvailable) * 100)
    : 100; // Default when starting clean with no records

  // Critical issues override
  if (openCriticalIssues.length > 0) {
    factors.push(`${openCriticalIssues.length} unresolved critical issue(s)`);
  }

  let finalStatus: 'Good' | 'Needs Attention' | 'Critical' = 'Good';

  if (openCriticalIssues.length > 0 || normalizedScore < 60) {
    finalStatus = 'Critical';
  } else if (normalizedScore < 78 || factors.length > 0) {
    finalStatus = 'Needs Attention';
  } else {
    finalStatus = 'Good';
  }

  const reason = factors.length > 0 
    ? factors.join(' • ') 
    : 'All tracked school indicators are performing at or above benchmarks.';

  return {
    status: finalStatus,
    overallScore: normalizedScore,
    indicators: {
      studentAttendance: {
        score: studentAttPct,
        weight: config.status_weights.student_attendance,
        status: studAttStatus
      },
      teacherAttendance: {
        score: teacherAttPct,
        weight: config.status_weights.teacher_attendance,
        status: teachAttStatus
      },
      academics: {
        score: academicAvg,
        weight: config.status_weights.academic_performance,
        status: academicStatus
      },
      passRate: {
        score: passRate,
        weight: config.status_weights.pass_rate,
        status: passRateStatus
      },
      targets: {
        score: targetsAvgPct,
        weight: config.status_weights.targets,
        status: targetsStatus
      },
      criticalIssues: {
        count: openCriticalIssues.length,
        status: openCriticalIssues.length === 0 ? 'good' : openCriticalIssues.length === 1 ? 'warning' : 'critical'
      }
    },
    summaryReason: reason,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}
