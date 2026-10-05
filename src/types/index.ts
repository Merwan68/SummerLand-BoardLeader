export type SchoolType = 'Kindergarten & Elementary';

export interface SchoolConfig {
  id: string;
  name: string;
  type: SchoolType;
  academic_year: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  status_weights: {
    student_attendance: number;
    teacher_attendance: number;
    academic_performance: number;
    pass_rate: number;
    targets: number;
    critical_issues: number;
  };
  thresholds: {
    attendance_good: number;
    attendance_warning: number;
    academic_good: number;
    academic_warning: number;
    pass_mark: number;
  };
  grading_rules: GradingRule[];
}

export interface GradingRule {
  grade: string;
  min_score: number;
  max_score: number;
  description: string;
  gpa?: number;
}

export type GradeLevel = 'kindergarten' | 'elementary';

export interface Grade {
  id: string;
  name: string;
  level: GradeLevel;
  order_number: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade_id: string;
  section: string;
  academic_year: string;
  teacher_id?: string;
  capacity: number;
  status: 'active' | 'inactive';
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  grade_ids: string[];
  status: 'active' | 'inactive';
}

export type Gender = 'Male' | 'Female';

export type StudentStatus = 'Active' | 'Inactive' | 'Graduated' | 'Transferred';

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: Gender;
  date_of_birth: string;
  grade_id: string;
  class_id: string;
  academic_year: string;
  enrollment_date: string;
  status: StudentStatus;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type TeacherStatus = 'Active' | 'Inactive' | 'On Leave';

export interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: Gender;
  subject_ids: string[];
  grade_ids: string[];
  employment_status: TeacherStatus;
  hire_date: string;
  contact?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type StudentAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  grade_id: string;
  date: string; // YYYY-MM-DD
  status: StudentAttendanceStatus;
  notes?: string;
}

export type TeacherAttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface TeacherAttendanceRecord {
  id: string;
  teacher_id: string;
  date: string; // YYYY-MM-DD
  status: TeacherAttendanceStatus;
  notes?: string;
}

export type AssessmentType = 'Quiz' | 'Assignment' | 'Midterm' | 'Final Exam' | 'Continuous Assessment' | string;
export type AcademicTerm = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4';

export interface Assessment {
  id: string;
  name: string;
  type: AssessmentType;
  term: AcademicTerm;
  date: string;
  max_score: number;
  grade_id: string;
  class_id: string;
  subject_id: string;
  created_at: string;
}

export interface Mark {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number;
  notes?: string;
  created_at: string;
}

export type TargetIndicator = 'student_attendance' | 'teacher_attendance' | 'academic_performance' | 'pass_rate' | 'custom';
export type TargetStatus = 'in_progress' | 'achieved' | 'missed';

export interface SchoolTarget {
  id: string;
  indicator: TargetIndicator;
  title: string;
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: TargetStatus;
  notes?: string;
}

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved';
export type IssueCategory = 'Academic' | 'Attendance' | 'Staff' | 'Student' | 'Infrastructure' | 'Administration' | 'Safety' | 'Other';

export interface SchoolIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  responsible_person?: string;
  deadline?: string;
  status: IssueStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type FacilityStatus = 'Good' | 'Needs Maintenance' | 'Critical';

export interface Facility {
  id: string;
  name: string;
  status: FacilityStatus;
  description?: string;
  inspection_date?: string;
  notes?: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  entity_type: string;
  entity_id?: string;
}

export type OverallSchoolStatus = 'Good' | 'Needs Attention' | 'Critical';

export interface SchoolStatusCalculation {
  status: OverallSchoolStatus;
  overallScore: number;
  indicators: {
    studentAttendance: { score: number | null; weight: number; status: 'good' | 'warning' | 'critical' | 'none' };
    teacherAttendance: { score: number | null; weight: number; status: 'good' | 'warning' | 'critical' | 'none' };
    academics: { score: number | null; weight: number; status: 'good' | 'warning' | 'critical' | 'none' };
    passRate: { score: number | null; weight: number; status: 'good' | 'warning' | 'critical' | 'none' };
    targets: { score: number | null; weight: number; status: 'good' | 'warning' | 'critical' | 'none' };
    criticalIssues: { count: number; status: 'good' | 'warning' | 'critical' };
  };
  summaryReason: string;
  lastUpdated: string;
}

export type Language = 'en' | 'am';
