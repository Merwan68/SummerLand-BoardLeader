import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  SchoolConfig,
  Grade,
  ClassRoom,
  Subject,
  Student,
  Teacher,
  StudentAttendanceRecord,
  TeacherAttendanceRecord,
  Assessment,
  Mark,
  SchoolTarget,
  SchoolIssue,
  Facility,
  ActivityLog,
  SchoolStatusCalculation,
  Language
} from '../types';
import { computeSchoolStatus } from '../utils/calculations';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface AuthUser {
  uid?: string;
  email: string;
  name: string;
  role: 'Board Leader';
  photoURL?: string;
}

export interface SingleLeaderAccount {
  email: string;
  name: string;
  password?: string;
  uid?: string;
  createdAt: string;
  updatedAt: string;
}

interface SchoolContextType {
  // Auth & Single Leader Account Management
  isAuthenticated: boolean;
  user: AuthUser | null;
  hasLeaderAccount: boolean;
  singleLeaderAccount: SingleLeaderAccount | null;
  createSingleLeaderAccount: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  login: (emailOrUser: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateLeaderAccount: (data: { name?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  
  // Cloud Sync
  isCloudSynced: boolean;
  syncError: string | null;
  syncToCloud: () => Promise<void>;
  
  // School Info & Config
  config: SchoolConfig;
  updateConfig: (updated: Partial<SchoolConfig>) => void;
  
  // Multi-Language
  lang: Language;
  setLang: (lang: Language) => void;
  
  // First time setup
  hasCompletedSetup: boolean;
  completeSetup: () => void;
  resetSetupPrompt: () => void;
  
  // Calculated School Status
  schoolStatus: SchoolStatusCalculation;
  
  // Grades
  grades: Grade[];
  addGrade: (grade: Omit<Grade, 'id'>) => void;
  updateGrade: (id: string, grade: Partial<Grade>) => void;
  deleteGrade: (id: string) => boolean;
  
  // Classes
  classes: ClassRoom[];
  addClass: (cls: Omit<ClassRoom, 'id'>) => void;
  updateClass: (id: string, cls: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => boolean;
  
  // Subjects
  subjects: Subject[];
  addSubject: (subj: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subj: Partial<Subject>) => void;
  deleteSubject: (id: string) => boolean;
  
  // Students
  students: Student[];
  addStudent: (stud: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => { success: boolean; error?: string };
  updateStudent: (id: string, stud: Partial<Student>) => { success: boolean; error?: string };
  deleteStudent: (id: string) => void;
  
  // Teachers
  teachers: Teacher[];
  addTeacher: (teach: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) => { success: boolean; error?: string };
  updateTeacher: (id: string, teach: Partial<Teacher>) => { success: boolean; error?: string };
  deleteTeacher: (id: string) => void;
  
  // Attendance
  studentAttendance: StudentAttendanceRecord[];
  saveStudentAttendanceBulk: (records: Omit<StudentAttendanceRecord, 'id'>[]) => void;
  deleteStudentAttendanceRecord: (id: string) => void;
  
  teacherAttendance: TeacherAttendanceRecord[];
  saveTeacherAttendanceBulk: (records: Omit<TeacherAttendanceRecord, 'id'>[]) => void;
  
  // Academic & Marks
  assessments: Assessment[];
  addAssessment: (assessment: Omit<Assessment, 'id' | 'created_at'>) => Assessment;
  updateAssessment: (id: string, assessment: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  
  marks: Mark[];
  saveMarksBulk: (marksList: Omit<Mark, 'id' | 'created_at'>[]) => void;
  deleteMark: (id: string) => void;
  
  // Targets
  targets: SchoolTarget[];
  addTarget: (target: Omit<SchoolTarget, 'id'>) => void;
  updateTarget: (id: string, target: Partial<SchoolTarget>) => void;
  deleteTarget: (id: string) => void;
  
  // Issues
  issues: SchoolIssue[];
  addIssue: (issue: Omit<SchoolIssue, 'id' | 'created_at' | 'updated_at'>) => void;
  updateIssue: (id: string, issue: Partial<SchoolIssue>) => void;
  deleteIssue: (id: string) => void;
  
  // Facilities
  facilities: Facility[];
  addFacility: (facility: Omit<Facility, 'id' | 'updated_at'>) => void;
  updateFacility: (id: string, facility: Partial<Facility>) => void;
  deleteFacility: (id: string) => void;
  
  // Activity History
  activityLogs: ActivityLog[];
  logAction: (action: string, details: string, entity_type: string, entity_id?: string) => void;
  
  // Data Export / Reset
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;
  clearAllData: () => void;
}

const STORAGE_KEY_PREFIX = 'summerland_academy_';

const initialSchoolConfig: SchoolConfig = {
  id: 'summerland_main',
  name: 'Summerland Academy',
  type: 'Kindergarten & Elementary',
  academic_year: '2019 E.C. / 2026–2027 G.C.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status_weights: {
    student_attendance: 25,
    teacher_attendance: 15,
    academic_performance: 30,
    pass_rate: 15,
    targets: 10,
    critical_issues: 5
  },
  thresholds: {
    attendance_good: 92,
    attendance_warning: 85,
    academic_good: 75,
    academic_warning: 60,
    pass_mark: 50
  },
  grading_rules: [
    { grade: 'A+', min_score: 90, max_score: 100, description: 'Excellent / Distinction', gpa: 4.0 },
    { grade: 'A', min_score: 80, max_score: 89, description: 'Very Good', gpa: 3.75 },
    { grade: 'B', min_score: 70, max_score: 79, description: 'Good', gpa: 3.0 },
    { grade: 'C', min_score: 60, max_score: 69, description: 'Satisfactory', gpa: 2.0 },
    { grade: 'D', min_score: 50, max_score: 59, description: 'Pass / Needs Improvement', gpa: 1.0 },
    { grade: 'F', min_score: 0, max_score: 49, description: 'Fail', gpa: 0.0 }
  ]
};

// Initial configurable grade structure: Kindergarten KG 1-3 & Elementary Grade 1-8
const initialGrades: Grade[] = [
  { id: 'g_kg1', name: 'KG 1', level: 'kindergarten', order_number: 1 },
  { id: 'g_kg2', name: 'KG 2', level: 'kindergarten', order_number: 2 },
  { id: 'g_kg3', name: 'KG 3', level: 'kindergarten', order_number: 3 },
  { id: 'g_gr1', name: 'Grade 1', level: 'elementary', order_number: 4 },
  { id: 'g_gr2', name: 'Grade 2', level: 'elementary', order_number: 5 },
  { id: 'g_gr3', name: 'Grade 3', level: 'elementary', order_number: 6 },
  { id: 'g_gr4', name: 'Grade 4', level: 'elementary', order_number: 7 },
  { id: 'g_gr5', name: 'Grade 5', level: 'elementary', order_number: 8 },
  { id: 'g_gr6', name: 'Grade 6', level: 'elementary', order_number: 9 },
  { id: 'g_gr7', name: 'Grade 7', level: 'elementary', order_number: 10 },
  { id: 'g_gr8', name: 'Grade 8', level: 'elementary', order_number: 11 }
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading storage key ${key}:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving storage key ${key}:`, err);
  }
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return loadFromStorage<boolean>('auth_status', false);
  });
  const [singleLeaderAccount, setSingleLeaderAccount] = useState<SingleLeaderAccount | null>(() => {
    return loadFromStorage<SingleLeaderAccount | null>('single_leader_account', null);
  });
  const [hasLeaderAccount, setHasLeaderAccount] = useState<boolean>(() => {
    const local = loadFromStorage<SingleLeaderAccount | null>('single_leader_account', null);
    return Boolean(local && local.email);
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    return loadFromStorage<AuthUser | null>('auth_user', null);
  });

  // Check Firestore on startup for registered single Board Leader account
  useEffect(() => {
    async function checkCloudLeaderAccount() {
      try {
        const sysRef = doc(db, 'system', 'board_leader_config');
        const snap = await getDoc(sysRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.leaderAccountCreated) {
            setHasLeaderAccount(true);
            setSingleLeaderAccount(prev => {
              if (prev && prev.email) return prev;
              return {
                email: data.leaderEmail || '',
                name: data.leaderName || 'Board Leader',
                uid: data.leaderUid,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString()
              };
            });
          }
        }
      } catch (e) {
        // Offline or permissions
      }
    }
    checkCloudLeaderAccount();
  }, []);

  // Sync single account to local storage
  useEffect(() => {
    saveToStorage('single_leader_account', singleLeaderAccount);
    if (singleLeaderAccount && singleLeaderAccount.email) {
      setHasLeaderAccount(true);
    }
  }, [singleLeaderAccount]);

  // Cloud sync state
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Language
  const [lang, setLangState] = useState<Language>(() => {
    return loadFromStorage<Language>('language', 'en');
  });

  // Setup wizard
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean>(() => {
    return loadFromStorage<boolean>('setup_done', false);
  });

  // Config & Entities
  const [config, setConfigState] = useState<SchoolConfig>(() => {
    return loadFromStorage<SchoolConfig>('config', initialSchoolConfig);
  });
  const [grades, setGrades] = useState<Grade[]>(() => {
    const loaded = loadFromStorage<Grade[]>('grades', initialGrades);
    const standardElementary = [
      { id: 'g_gr1', name: 'Grade 1', level: 'elementary' as const, order_number: 4 },
      { id: 'g_gr2', name: 'Grade 2', level: 'elementary' as const, order_number: 5 },
      { id: 'g_gr3', name: 'Grade 3', level: 'elementary' as const, order_number: 6 },
      { id: 'g_gr4', name: 'Grade 4', level: 'elementary' as const, order_number: 7 },
      { id: 'g_gr5', name: 'Grade 5', level: 'elementary' as const, order_number: 8 },
      { id: 'g_gr6', name: 'Grade 6', level: 'elementary' as const, order_number: 9 },
      { id: 'g_gr7', name: 'Grade 7', level: 'elementary' as const, order_number: 10 },
      { id: 'g_gr8', name: 'Grade 8', level: 'elementary' as const, order_number: 11 },
    ];
    let merged = [...loaded];
    for (const elem of standardElementary) {
      const idx = merged.findIndex(g => g.name.toLowerCase() === elem.name.toLowerCase() || g.id === elem.id);
      if (idx === -1) {
        merged.push(elem);
      } else {
        merged[idx] = { ...merged[idx], level: 'elementary' };
      }
    }
    return merged.sort((a, b) => a.order_number - b.order_number);
  });
  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    return loadFromStorage<ClassRoom[]>('classes', []);
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    return loadFromStorage<Subject[]>('subjects', []);
  });
  const [students, setStudents] = useState<Student[]>(() => {
    return loadFromStorage<Student[]>('students', []);
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    return loadFromStorage<Teacher[]>('teachers', []);
  });
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceRecord[]>(() => {
    return loadFromStorage<StudentAttendanceRecord[]>('student_attendance', []);
  });
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceRecord[]>(() => {
    return loadFromStorage<TeacherAttendanceRecord[]>('teacher_attendance', []);
  });
  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    return loadFromStorage<Assessment[]>('assessments', []);
  });
  const [marks, setMarks] = useState<Mark[]>(() => {
    return loadFromStorage<Mark[]>('marks', []);
  });
  const [targets, setTargets] = useState<SchoolTarget[]>(() => {
    return loadFromStorage<SchoolTarget[]>('targets', []);
  });
  const [issues, setIssues] = useState<SchoolIssue[]>(() => {
    return loadFromStorage<SchoolIssue[]>('issues', []);
  });
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    return loadFromStorage<Facility[]>('facilities', []);
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    return loadFromStorage<ActivityLog[]>('activity_logs', []);
  });

  // Sync to storage
  useEffect(() => { saveToStorage('auth_status', isAuthenticated); }, [isAuthenticated]);
  useEffect(() => { saveToStorage('auth_user', user); }, [user]);
  useEffect(() => { saveToStorage('single_leader_account', singleLeaderAccount); }, [singleLeaderAccount]);
  useEffect(() => { saveToStorage('language', lang); }, [lang]);
  useEffect(() => { saveToStorage('setup_done', hasCompletedSetup); }, [hasCompletedSetup]);
  useEffect(() => { saveToStorage('config', config); }, [config]);
  useEffect(() => { saveToStorage('grades', grades); }, [grades]);
  useEffect(() => { saveToStorage('classes', classes); }, [classes]);
  useEffect(() => { saveToStorage('subjects', subjects); }, [subjects]);
  useEffect(() => { saveToStorage('students', students); }, [students]);
  useEffect(() => { saveToStorage('teachers', teachers); }, [teachers]);
  useEffect(() => { saveToStorage('student_attendance', studentAttendance); }, [studentAttendance]);
  useEffect(() => { saveToStorage('teacher_attendance', teacherAttendance); }, [teacherAttendance]);
  useEffect(() => { saveToStorage('assessments', assessments); }, [assessments]);
  useEffect(() => { saveToStorage('marks', marks); }, [marks]);
  useEffect(() => { saveToStorage('targets', targets); }, [targets]);
  useEffect(() => { saveToStorage('issues', issues); }, [issues]);
  useEffect(() => { saveToStorage('facilities', facilities); }, [facilities]);
  useEffect(() => { saveToStorage('activity_logs', activityLogs); }, [activityLogs]);

  // Logging function
  const logAction = (action: string, details: string, entity_type: string, entity_id?: string) => {
    const newLog: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      action,
      details,
      timestamp: new Date().toISOString(),
      entity_type,
      entity_id
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  // Cloud Firestore Sync Function
  const syncToCloud = async () => {
    if (!isAuthenticated) return;
    try {
      const payloadObj = {
        config,
        grades,
        classes,
        subjects,
        students,
        teachers,
        studentAttendance,
        teacherAttendance,
        assessments,
        marks,
        targets,
        issues,
        facilities,
        activityLogs
      };

      const schoolRef = doc(db, 'schools', 'summerland_main');
      await setDoc(schoolRef, {
        schoolId: 'summerland_main',
        updatedBy: user?.uid || user?.email || 'board_leader',
        payload: JSON.stringify(payloadObj),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setIsCloudSynced(true);
      setSyncError(null);
    } catch (err) {
      console.warn('Firestore cloud sync pending or offline:', err);
      // Non-fatal, local persistence maintains full state
      setIsCloudSynced(false);
    }
  };

  // Auto-sync debounce to Firestore
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        syncToCloud();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    config, 
    grades, 
    classes, 
    subjects, 
    students, 
    teachers, 
    studentAttendance, 
    teacherAttendance, 
    assessments, 
    marks, 
    targets, 
    issues, 
    facilities
  ]);

  // Load from Firestore on initial auth
  const loadSchoolFromFirestore = async () => {
    try {
      const schoolRef = doc(db, 'schools', 'summerland_main');
      const snap = await getDoc(schoolRef);
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData.payload) {
          const parsed = JSON.parse(cloudData.payload);
          if (parsed.classes && parsed.classes.length > 0) setClasses(parsed.classes);
          if (parsed.subjects && parsed.subjects.length > 0) setSubjects(parsed.subjects);
          if (parsed.students && parsed.students.length > 0) setStudents(parsed.students);
          if (parsed.teachers && parsed.teachers.length > 0) setTeachers(parsed.teachers);
          if (parsed.studentAttendance && parsed.studentAttendance.length > 0) setStudentAttendance(parsed.studentAttendance);
          if (parsed.teacherAttendance && parsed.teacherAttendance.length > 0) setTeacherAttendance(parsed.teacherAttendance);
          if (parsed.assessments && parsed.assessments.length > 0) setAssessments(parsed.assessments);
          if (parsed.marks && parsed.marks.length > 0) setMarks(parsed.marks);
          if (parsed.targets && parsed.targets.length > 0) setTargets(parsed.targets);
          if (parsed.issues && parsed.issues.length > 0) setIssues(parsed.issues);
          if (parsed.facilities && parsed.facilities.length > 0) setFacilities(parsed.facilities);
          setIsCloudSynced(true);
        }
      }
    } catch (err) {
      console.warn('Could not read school from Firestore:', err);
    }
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const activeUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Board Leader',
          role: 'Board Leader',
          photoURL: firebaseUser.photoURL || undefined
        };
        setUser(activeUser);
        setIsAuthenticated(true);
        loadSchoolFromFirestore();

        // Ensure board leader profile document exists in Firestore
        try {
          const leaderRef = doc(db, 'board_leaders', firebaseUser.uid);
          await setDoc(leaderRef, {
            email: firebaseUser.email,
            name: activeUser.name,
            role: 'Board Leader',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn('Leader document update skipped:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Create single Board Leader account (Only 1 account can ever be created)
  const createSingleLeaderAccount = async (email: string, password: string, name: string = 'Board Leader'): Promise<{ success: boolean; error?: string }> => {
    if (hasLeaderAccount && singleLeaderAccount?.email) {
      return { 
        success: false, 
        error: 'A Board Leader account already exists for Summerland Academy. Only 1 account is permitted. Please sign in.' 
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const now = new Date().toISOString();

    try {
      // 1. Create in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }

      // 2. Persist to Firestore /board_leaders/{uid}
      try {
        await setDoc(doc(db, 'board_leaders', cred.user.uid), {
          email: cleanEmail,
          name,
          role: 'Board Leader',
          createdAt: now,
          updatedAt: now
        });
      } catch (err) {
        console.warn('Firestore profile write error:', err);
      }

      // 3. Mark in Firestore /system/board_leader_config so system knows 1 account exists
      try {
        await setDoc(doc(db, 'system', 'board_leader_config'), {
          leaderAccountCreated: true,
          leaderEmail: cleanEmail,
          leaderName: name,
          leaderUid: cred.user.uid,
          createdAt: now,
          updatedAt: now
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore system flag write error:', err);
      }

      const activeUser: AuthUser = {
        uid: cred.user.uid,
        email: cleanEmail,
        name,
        role: 'Board Leader'
      };

      const accountObj: SingleLeaderAccount = {
        email: cleanEmail,
        name,
        password,
        uid: cred.user.uid,
        createdAt: now,
        updatedAt: now
      };

      setSingleLeaderAccount(accountObj);
      setHasLeaderAccount(true);
      setUser(activeUser);
      setIsAuthenticated(true);

      logAction('Account Created', `Single Board Leader account established: ${cleanEmail}`, 'Auth');
      return { success: true };
    } catch (fbErr: any) {
      console.warn('Firebase createUser failed, falling back to local database credential store:', fbErr?.code, fbErr?.message);
      
      const accountObj: SingleLeaderAccount = {
        email: cleanEmail,
        name,
        password,
        createdAt: now,
        updatedAt: now
      };

      // Try setting system config flag in Firestore if online
      try {
        await setDoc(doc(db, 'system', 'board_leader_config'), {
          leaderAccountCreated: true,
          leaderEmail: cleanEmail,
          leaderName: name,
          createdAt: now,
          updatedAt: now
        }, { merge: true });
      } catch (e) {
        // offline
      }

      setSingleLeaderAccount(accountObj);
      setHasLeaderAccount(true);

      const activeUser: AuthUser = {
        email: cleanEmail,
        name,
        role: 'Board Leader'
      };
      setUser(activeUser);
      setIsAuthenticated(true);

      logAction('Account Created', `Single Board Leader account created: ${cleanEmail}`, 'Auth');
      return { success: true };
    }
  };

  // Sign up alias to createSingleLeaderAccount
  const signUp = async (email: string, password: string, name: string = 'Board Leader'): Promise<{ success: boolean; error?: string }> => {
    return createSingleLeaderAccount(email, password, name);
  };

  // Sign in with email/password - strictly for the single Board Leader account
  const login = async (emailOrUser: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = emailOrUser.trim().toLowerCase();

    // If an account has been established, enforce that only this registered email can sign in
    if (singleLeaderAccount && singleLeaderAccount.email) {
      if (cleanEmail !== singleLeaderAccount.email.toLowerCase()) {
        return {
          success: false,
          error: `Access Denied: Only the registered Board Leader (${singleLeaderAccount.email}) has permission to access Summerland Academy.`
        };
      }
    }

    // 1. Try Firebase Authentication
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const activeUser: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email || cleanEmail,
        name: cred.user.displayName || singleLeaderAccount?.name || 'Board Leader',
        role: 'Board Leader'
      };
      setUser(activeUser);
      setIsAuthenticated(true);
      logAction('Login', `Authenticated via Firebase: ${cleanEmail}`, 'Auth');
      return { success: true };
    } catch (fbErr: any) {
      // 2. Fall back to local single leader credentials
      if (singleLeaderAccount && singleLeaderAccount.email.toLowerCase() === cleanEmail && singleLeaderAccount.password === password) {
        const activeUser: AuthUser = {
          uid: singleLeaderAccount.uid,
          email: cleanEmail,
          name: singleLeaderAccount.name || 'Board Leader',
          role: 'Board Leader'
        };
        setUser(activeUser);
        setIsAuthenticated(true);
        logAction('Login', `Authenticated with Board Leader credentials: ${cleanEmail}`, 'Auth');
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Invalid email or password. Please verify your credentials.' 
      };
    }
  };

  // Sign in with Google (only permitted if matches Board Leader)
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const userEmail = (res.user.email || '').toLowerCase();

      // If single account exists and email doesn't match, block sign-in
      if (singleLeaderAccount && singleLeaderAccount.email && userEmail !== singleLeaderAccount.email.toLowerCase()) {
        await firebaseSignOut(auth);
        return {
          success: false,
          error: `Google account (${userEmail}) does not match the registered Board Leader email (${singleLeaderAccount.email}).`
        };
      }

      const activeUser: AuthUser = {
        uid: res.user.uid,
        email: res.user.email || '',
        name: res.user.displayName || singleLeaderAccount?.name || 'Board Leader',
        role: 'Board Leader',
        photoURL: res.user.photoURL || undefined
      };
      setUser(activeUser);
      setIsAuthenticated(true);

      // If this was the first login establishing the account
      if (!singleLeaderAccount) {
        const now = new Date().toISOString();
        const accountObj: SingleLeaderAccount = {
          email: activeUser.email,
          name: activeUser.name,
          uid: res.user.uid,
          createdAt: now,
          updatedAt: now
        };
        setSingleLeaderAccount(accountObj);
        setHasLeaderAccount(true);

        try {
          await setDoc(doc(db, 'system', 'board_leader_config'), {
            leaderAccountCreated: true,
            leaderEmail: activeUser.email,
            leaderName: activeUser.name,
            leaderUid: res.user.uid,
            createdAt: now,
            updatedAt: now
          }, { merge: true });
        } catch (e) {
          // offline
        }
      }

      // Save to /board_leaders/{uid}
      try {
        await setDoc(doc(db, 'board_leaders', res.user.uid), {
          email: res.user.email,
          name: activeUser.name,
          role: 'Board Leader',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Leader document update skipped:', e);
      }

      logAction('Google Login', `Board Leader signed in with Google: ${res.user.email}`, 'Auth');
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      return { success: false, error: err?.message || 'Google sign-in was cancelled or encountered an error.' };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    setIsAuthenticated(false);
    setUser(null);
    logAction('Logout', 'Board Leader signed out', 'Auth');
  };

  // Edit the single Board Leader account profile (name and/or email)
  const updateLeaderAccount = async (data: { name?: string; email?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const now = new Date().toISOString();
      const updatedName = data.name?.trim() || user?.name || 'Board Leader';
      const updatedEmail = data.email?.trim().toLowerCase() || user?.email || '';

      if (data.email && (!updatedEmail || !updatedEmail.includes('@'))) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      // Update Firebase Auth profile if current user is logged in
      if (auth.currentUser && data.name) {
        try {
          await updateProfile(auth.currentUser, { displayName: updatedName });
        } catch (e) {
          console.warn('Could not update Firebase profile displayName:', e);
        }
      }

      // Update Firestore board_leaders document
      if (user?.uid) {
        try {
          await setDoc(doc(db, 'board_leaders', user.uid), {
            name: updatedName,
            email: updatedEmail,
            role: 'Board Leader',
            updatedAt: now
          }, { merge: true });
        } catch (e) {
          console.warn('Could not update Firestore board_leaders:', e);
        }
      }

      // Update system board_leader_config
      try {
        await setDoc(doc(db, 'system', 'board_leader_config'), {
          leaderName: updatedName,
          leaderEmail: updatedEmail,
          updatedAt: now
        }, { merge: true });
      } catch (e) {
        console.warn('Could not update Firestore system config:', e);
      }

      // Update local state
      setUser(prev => prev ? { ...prev, name: updatedName, email: updatedEmail } : null);
      setSingleLeaderAccount(prev => prev ? { ...prev, name: updatedName, email: updatedEmail, updatedAt: now } : null);

      logAction('Account Updated', `Board Leader account updated: ${updatedName} (${updatedEmail})`, 'Auth');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update account.' };
    }
  };

  // Change password for the single Board Leader account
  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    // Verify old password if stored locally
    if (singleLeaderAccount?.password && singleLeaderAccount.password !== oldPass) {
      return { success: false, message: 'Current password does not match.' };
    }

    // If logged in via Firebase Auth, update password
    if (auth.currentUser) {
      try {
        await firebaseUpdatePassword(auth.currentUser, newPass);
      } catch (err: any) {
        console.warn('Firebase updatePassword requires recent login, continuing local credential update:', err);
      }
    }

    // Update in single leader account store
    setSingleLeaderAccount(prev => prev ? { ...prev, password: newPass, updatedAt: new Date().toISOString() } : null);

    logAction('Password Changed', 'Board Leader updated account credentials', 'Auth');
    return { success: true, message: 'Password successfully updated in Firebase and system database.' };
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    document.documentElement.lang = newLang;
  };

  const completeSetup = () => {
    setHasCompletedSetup(true);
    logAction('Setup Completed', 'First-time school configuration wizard completed', 'Settings');
  };

  const resetSetupPrompt = () => {
    setHasCompletedSetup(false);
  };

  const updateConfig = (updated: Partial<SchoolConfig>) => {
    setConfigState(prev => ({
      ...prev,
      ...updated,
      updated_at: new Date().toISOString()
    }));
    logAction('School Settings Updated', 'Board Leader updated school parameters/thresholds', 'Config');
  };

  // Grade CRUD
  const addGrade = (g: Omit<Grade, 'id'>) => {
    const id = 'g_' + Date.now().toString(36);
    setGrades(prev => [...prev, { ...g, id }]);
    logAction('Grade Added', `Created grade: ${g.name}`, 'Grades', id);
  };

  const updateGrade = (id: string, updated: Partial<Grade>) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
    logAction('Grade Updated', `Updated grade details for ID: ${id}`, 'Grades', id);
  };

  const deleteGrade = (id: string): boolean => {
    const classCount = classes.filter(c => c.grade_id === id).length;
    if (classCount > 0) return false;
    setGrades(prev => prev.filter(g => g.id !== id));
    logAction('Grade Deleted', `Deleted grade ID: ${id}`, 'Grades', id);
    return true;
  };

  // Class CRUD
  const addClass = (cls: Omit<ClassRoom, 'id'>) => {
    const id = 'cls_' + Date.now().toString(36);
    setClasses(prev => [...prev, { ...cls, id }]);
    logAction('Class Added', `Created class section: ${cls.name}`, 'Classes', id);
  };

  const updateClass = (id: string, updated: Partial<ClassRoom>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    logAction('Class Updated', `Updated class ID: ${id}`, 'Classes', id);
  };

  const deleteClass = (id: string): boolean => {
    const studentCount = students.filter(s => s.class_id === id).length;
    if (studentCount > 0) return false;
    setClasses(prev => prev.filter(c => c.id !== id));
    logAction('Class Deleted', `Deleted class ID: ${id}`, 'Classes', id);
    return true;
  };

  // Subject CRUD
  const addSubject = (subj: Omit<Subject, 'id'>) => {
    const id = 'sub_' + Date.now().toString(36);
    setSubjects(prev => [...prev, { ...subj, id }]);
    logAction('Subject Added', `Created subject: ${subj.name} (${subj.code})`, 'Subjects', id);
  };

  const updateSubject = (id: string, updated: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    logAction('Subject Updated', `Updated subject ID: ${id}`, 'Subjects', id);
  };

  const deleteSubject = (id: string): boolean => {
    const assessmentCount = assessments.filter(a => a.subject_id === id).length;
    if (assessmentCount > 0) return false;
    setSubjects(prev => prev.filter(s => s.id !== id));
    logAction('Subject Deleted', `Deleted subject ID: ${id}`, 'Subjects', id);
    return true;
  };

  // Student CRUD
  const addStudent = (stud: Omit<Student, 'id' | 'created_at' | 'updated_at'>): { success: boolean; error?: string } => {
    if (students.some(s => s.student_id.toLowerCase() === stud.student_id.toLowerCase())) {
      return { success: false, error: `Student ID "${stud.student_id}" already exists. Please assign a unique ID.` };
    }
    const id = 'stu_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newStudent: Student = {
      ...stud,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setStudents(prev => [newStudent, ...prev]);
    logAction('Student Enrolled', `Enrolled student: ${stud.first_name} ${stud.last_name} (${stud.student_id})`, 'Students', id);
    return { success: true };
  };

  const updateStudent = (id: string, updated: Partial<Student>): { success: boolean; error?: string } => {
    if (updated.student_id) {
      const exists = students.some(s => s.id !== id && s.student_id.toLowerCase() === updated.student_id!.toLowerCase());
      if (exists) {
        return { success: false, error: `Student ID "${updated.student_id}" is already used by another student.` };
      }
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updated, updated_at: new Date().toISOString() } : s));
    logAction('Student Updated', `Updated student ID: ${id}`, 'Students', id);
    return { success: true };
  };

  const deleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    setMarks(prev => prev.filter(m => m.student_id !== id));
    setStudentAttendance(prev => prev.filter(a => a.student_id !== id));
    logAction('Student Deleted', `Removed student: ${student ? `${student.first_name} ${student.last_name}` : id}`, 'Students', id);
  };

  // Teacher CRUD
  const addTeacher = (teach: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>): { success: boolean; error?: string } => {
    if (teachers.some(t => t.teacher_id.toLowerCase() === teach.teacher_id.toLowerCase())) {
      return { success: false, error: `Teacher ID "${teach.teacher_id}" already exists. Please assign a unique ID.` };
    }
    const id = 'tch_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newTeacher: Teacher = {
      ...teach,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTeachers(prev => [newTeacher, ...prev]);
    logAction('Teacher Added', `Added teacher: ${teach.first_name} ${teach.last_name} (${teach.teacher_id})`, 'Teachers', id);
    return { success: true };
  };

  const updateTeacher = (id: string, updated: Partial<Teacher>): { success: boolean; error?: string } => {
    if (updated.teacher_id) {
      const exists = teachers.some(t => t.id !== id && t.teacher_id.toLowerCase() === updated.teacher_id!.toLowerCase());
      if (exists) {
        return { success: false, error: `Teacher ID "${updated.teacher_id}" already exists.` };
      }
    }
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updated, updated_at: new Date().toISOString() } : t));
    logAction('Teacher Updated', `Updated teacher details for ID: ${id}`, 'Teachers', id);
    return { success: true };
  };

  const deleteTeacher = (id: string) => {
    const teach = teachers.find(t => t.id === id);
    setTeachers(prev => prev.filter(t => t.id !== id));
    setTeacherAttendance(prev => prev.filter(a => a.teacher_id !== id));
    setClasses(prev => prev.map(c => c.teacher_id === id ? { ...c, teacher_id: undefined } : c));
    logAction('Teacher Deleted', `Removed teacher: ${teach ? `${teach.first_name} ${teach.last_name}` : id}`, 'Teachers', id);
  };

  // Student Attendance
  const saveStudentAttendanceBulk = (records: Omit<StudentAttendanceRecord, 'id'>[]) => {
    setStudentAttendance(prev => {
      const key = (r: { student_id: string; date: string }) => `${r.student_id}_${r.date}`;
      const newMap = new Map<string, StudentAttendanceRecord>();
      
      prev.forEach(r => newMap.set(key(r), r));
      records.forEach(r => {
        const id = 'att_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        newMap.set(key(r), { ...r, id });
      });

      return Array.from(newMap.values());
    });
    logAction('Student Attendance Recorded', `Logged attendance entries for ${records.length} students`, 'Attendance');
  };

  const deleteStudentAttendanceRecord = (id: string) => {
    setStudentAttendance(prev => prev.filter(a => a.id !== id));
  };

  // Teacher Attendance
  const saveTeacherAttendanceBulk = (records: Omit<TeacherAttendanceRecord, 'id'>[]) => {
    setTeacherAttendance(prev => {
      const key = (r: { teacher_id: string; date: string }) => `${r.teacher_id}_${r.date}`;
      const newMap = new Map<string, TeacherAttendanceRecord>();
      
      prev.forEach(r => newMap.set(key(r), r));
      records.forEach(r => {
        const id = 'tatt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        newMap.set(key(r), { ...r, id });
      });

      return Array.from(newMap.values());
    });
    logAction('Teacher Attendance Recorded', `Logged attendance entries for ${records.length} teachers`, 'Attendance');
  };

  // Academic / Marks
  const addAssessment = (assessment: Omit<Assessment, 'id' | 'created_at'>): Assessment => {
    const id = 'asm_' + Date.now().toString(36);
    const newAssessment: Assessment = {
      ...assessment,
      id,
      created_at: new Date().toISOString()
    };
    setAssessments(prev => [newAssessment, ...prev]);
    logAction('Assessment Created', `Created assessment: ${assessment.name} (Max: ${assessment.max_score})`, 'Assessments', id);
    return newAssessment;
  };

  const updateAssessment = (id: string, updated: Partial<Assessment>) => {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    logAction('Assessment Updated', `Updated assessment ID: ${id}`, 'Assessments', id);
  };

  const deleteAssessment = (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
    setMarks(prev => prev.filter(m => m.assessment_id !== id));
    logAction('Assessment Deleted', `Deleted assessment and associated marks for ID: ${id}`, 'Assessments', id);
  };

  const saveMarksBulk = (marksList: Omit<Mark, 'id' | 'created_at'>[]) => {
    setMarks(prev => {
      const key = (m: { assessment_id: string; student_id: string }) => `${m.assessment_id}_${m.student_id}`;
      const newMap = new Map<string, Mark>();
      
      prev.forEach(m => newMap.set(key(m), m));
      marksList.forEach(m => {
        const id = 'mrk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        newMap.set(key(m), { ...m, id, created_at: new Date().toISOString() });
      });

      return Array.from(newMap.values());
    });
    logAction('Marks Recorded', `Saved marks for ${marksList.length} student entries`, 'Academics');
  };

  const deleteMark = (id: string) => {
    setMarks(prev => prev.filter(m => m.id !== id));
  };

  // Targets
  const addTarget = (target: Omit<SchoolTarget, 'id'>) => {
    const id = 'tgt_' + Date.now().toString(36);
    setTargets(prev => [...prev, { ...target, id }]);
    logAction('Target Added', `Created target: ${target.title} (${target.target_value}${target.unit})`, 'Targets', id);
  };

  const updateTarget = (id: string, updated: Partial<SchoolTarget>) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    logAction('Target Updated', `Updated target ID: ${id}`, 'Targets', id);
  };

  const deleteTarget = (id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    logAction('Target Deleted', `Deleted target ID: ${id}`, 'Targets', id);
  };

  // Issues
  const addIssue = (issue: Omit<SchoolIssue, 'id' | 'created_at' | 'updated_at'>) => {
    const id = 'iss_' + Date.now().toString(36);
    const newIssue: SchoolIssue = {
      ...issue,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setIssues(prev => [newIssue, ...prev]);
    logAction('Issue Logged', `Logged issue: ${issue.title} [${issue.priority}]`, 'Issues', id);
  };

  const updateIssue = (id: string, updated: Partial<SchoolIssue>) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...updated, updated_at: new Date().toISOString() } : i));
    logAction('Issue Updated', `Updated issue ID: ${id}`, 'Issues', id);
  };

  const deleteIssue = (id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id));
    logAction('Issue Deleted', `Deleted issue ID: ${id}`, 'Issues', id);
  };

  // Facilities
  const addFacility = (fac: Omit<Facility, 'id' | 'updated_at'>) => {
    const id = 'fac_' + Date.now().toString(36);
    const newFac: Facility = {
      ...fac,
      id,
      updated_at: new Date().toISOString()
    };
    setFacilities(prev => [...prev, newFac]);
    logAction('Facility Added', `Registered facility: ${fac.name}`, 'Facilities', id);
  };

  const updateFacility = (id: string, updated: Partial<Facility>) => {
    setFacilities(prev => prev.map(f => f.id === id ? { ...f, ...updated, updated_at: new Date().toISOString() } : f));
    logAction('Facility Updated', `Updated facility ID: ${id}`, 'Facilities', id);
  };

  const deleteFacility = (id: string) => {
    setFacilities(prev => prev.filter(f => f.id !== id));
    logAction('Facility Deleted', `Deleted facility ID: ${id}`, 'Facilities', id);
  };

  // Backup & Restore
  const exportDatabaseJson = (): string => {
    const backup = {
      version: '2.0',
      school: config.name,
      academic_year: config.academic_year,
      exported_at: new Date().toISOString(),
      data: {
        config,
        grades,
        classes,
        subjects,
        students,
        teachers,
        studentAttendance,
        teacherAttendance,
        assessments,
        marks,
        targets,
        issues,
        facilities,
        activityLogs
      }
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !parsed.data) return false;
      const d = parsed.data;
      if (d.config) setConfigState(d.config);
      if (Array.isArray(d.grades)) setGrades(d.grades);
      if (Array.isArray(d.classes)) setClasses(d.classes);
      if (Array.isArray(d.subjects)) setSubjects(d.subjects);
      if (Array.isArray(d.students)) setStudents(d.students);
      if (Array.isArray(d.teachers)) setTeachers(d.teachers);
      if (Array.isArray(d.studentAttendance)) setStudentAttendance(d.studentAttendance);
      if (Array.isArray(d.teacherAttendance)) setTeacherAttendance(d.teacherAttendance);
      if (Array.isArray(d.assessments)) setAssessments(d.assessments);
      if (Array.isArray(d.marks)) setMarks(d.marks);
      if (Array.isArray(d.targets)) setTargets(d.targets);
      if (Array.isArray(d.issues)) setIssues(d.issues);
      if (Array.isArray(d.facilities)) setFacilities(d.facilities);
      if (Array.isArray(d.activityLogs)) setActivityLogs(d.activityLogs);
      logAction('Database Imported', 'Restored school records from JSON backup', 'System');
      syncToCloud();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  const clearAllData = () => {
    setClasses([]);
    setSubjects([]);
    setStudents([]);
    setTeachers([]);
    setStudentAttendance([]);
    setTeacherAttendance([]);
    setAssessments([]);
    setMarks([]);
    setTargets([]);
    setIssues([]);
    setFacilities([]);
    setActivityLogs([]);
    logAction('Database Cleared', 'Reset all operational records to zero state', 'System');
    syncToCloud();
  };

  // Overall School Status
  const schoolStatus = useMemo(() => {
    return computeSchoolStatus({
      config,
      studentAttendance,
      teacherAttendance,
      marks,
      assessments,
      targets,
      issues
    });
  }, [config, studentAttendance, teacherAttendance, marks, assessments, targets, issues]);

  const value = {
    isAuthenticated,
    user,
    hasLeaderAccount,
    singleLeaderAccount,
    createSingleLeaderAccount,
    updateLeaderAccount,
    login,
    signUp,
    loginWithGoogle,
    logout,
    changePassword,
    isCloudSynced,
    syncError,
    syncToCloud,
    config,
    updateConfig,
    lang,
    setLang,
    hasCompletedSetup,
    completeSetup,
    resetSetupPrompt,
    schoolStatus,
    grades,
    addGrade,
    updateGrade,
    deleteGrade,
    classes,
    addClass,
    updateClass,
    deleteClass,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    studentAttendance,
    saveStudentAttendanceBulk,
    deleteStudentAttendanceRecord,
    teacherAttendance,
    saveTeacherAttendanceBulk,
    assessments,
    addAssessment,
    updateAssessment,
    deleteAssessment,
    marks,
    saveMarksBulk,
    deleteMark,
    targets,
    addTarget,
    updateTarget,
    deleteTarget,
    issues,
    addIssue,
    updateIssue,
    deleteIssue,
    facilities,
    addFacility,
    updateFacility,
    deleteFacility,
    activityLogs,
    logAction,
    exportDatabaseJson,
    importDatabaseJson,
    clearAllData
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
};

export const useSchool = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
