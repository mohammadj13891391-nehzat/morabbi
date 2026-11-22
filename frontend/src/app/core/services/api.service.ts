import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApproveUserPayload,
  Attendance,
  AuthUserDto,
  AwardRecognitionPayload,
  BoardEntry,
  Branch,
  ChangePasswordPayload,
  CreateBranchPayload,
  CreateEvaluationPayload,
  CreateHadithPayload,
  CreateLessonPlanPayload,
  CreateMaktabPayload,
  CreateMethodologyPayload,
  CreatePersonPayload,
  CreateQuranVersePayload,
  CreateReportPayload,
  CreateSessionPayload,
  CreateTaskPayload,
  DashboardData,
  DailyReport,
  DailyTracker,
  Evaluation,
  EvaluationCriteria,
  LessonPlan,
  LoginResponse,
  Maktab,
  Methodology,
  MorabbiHadith,
  MorabbiSession,
  MorabbiTask,
  NotificationListResponse,
  Person,
  PointTransaction,
  QuranVerse,
  Recognition,
  RegisterPayload,
  SetAttendancePayload,
  UpdateBranchPayload,
  UpdateEvaluationPayload,
  UpdateHadithPayload,
  UpdateLessonPlanPayload,
  UpdateMaktabPayload,
  UpdateMethodologyPayload,
  UpdatePersonPayload,
  UpdateQuranVersePayload,
  UpdateReportPayload,
  UpdateSessionPayload,
  UpdateTaskPayload,
  UpsertTrackerPayload
} from '../models/morabbi.models';

const TOKEN_KEY = 'morabbi_token';
const USER_KEY = 'morabbi_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly user = signal<AuthUserDto | null>(this.restoreUser());
  readonly isAuthenticated = signal<boolean>(!!localStorage.getItem(TOKEN_KEY));

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(phone: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}/api/auth/local`, { phone, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this.user.set(res.user);
          this.isAuthenticated.set(true);
        })
      );
  }

  register(payload: RegisterPayload): Observable<{ message: string; user: AuthUserDto }> {
    return this.http.post<{ message: string; user: AuthUserDto }>(`${this.base}/api/auth/register`, payload);
  }

  me(): Observable<AuthUserDto> {
    return this.http.get<AuthUserDto>(`${this.base}/api/auth/me`);
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/api/auth/change-password`, payload);
  }

  pendingApprovals(): Observable<AuthUserDto[]> {
    return this.http.get<AuthUserDto[]>(`${this.base}/api/auth/pending-approvals`);
  }

  approveUser(payload: ApproveUserPayload): Observable<AuthUserDto> {
    return this.http.post<AuthUserDto>(`${this.base}/api/auth/approve`, payload);
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.base}/api/dashboard`);
  }

  getReports(branchId?: number): Observable<DailyReport[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId.toString());
    return this.http.get<DailyReport[]>(`${this.base}/api/reports`, { params });
  }

  getReport(id: number): Observable<DailyReport> {
    return this.http.get<DailyReport>(`${this.base}/api/reports/${id}`);
  }

  createReport(payload: CreateReportPayload): Observable<{ report: DailyReport }> {
    return this.http.post<{ report: DailyReport }>(`${this.base}/api/reports`, payload);
  }

  updateReport(id: number, payload: UpdateReportPayload): Observable<{ report: DailyReport }> {
    return this.http.put<{ report: DailyReport }>(`${this.base}/api/reports/${id}`, payload);
  }

  returnReport(id: number, comment: string | null): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/api/reports/${id}/return`, { comment });
  }

  getLessonPlans(branchId?: number): Observable<LessonPlan[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId.toString());
    return this.http.get<LessonPlan[]>(`${this.base}/api/lesson-plans`, { params });
  }

  getLessonPlan(id: number): Observable<LessonPlan> {
    return this.http.get<LessonPlan>(`${this.base}/api/lesson-plans/${id}`);
  }

  createLessonPlan(payload: CreateLessonPlanPayload): Observable<{ lessonPlan: LessonPlan }> {
    return this.http.post<{ lessonPlan: LessonPlan }>(`${this.base}/api/lesson-plans`, payload);
  }

  updateLessonPlan(id: number, payload: UpdateLessonPlanPayload): Observable<{ lessonPlan: LessonPlan }> {
    return this.http.put<{ lessonPlan: LessonPlan }>(`${this.base}/api/lesson-plans/${id}`, payload);
  }

  returnLessonPlan(id: number, comment: string | null): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/api/lesson-plans/${id}/return`, { comment });
  }

  getCriteria(type: 'REPORT' | 'LESSON_PLAN'): Observable<EvaluationCriteria[]> {
    return this.http.get<EvaluationCriteria[]>(`${this.base}/api/evaluation-criteria`, {
      params: new HttpParams().set('type', type)
    });
  }

  getEvaluations(targetType: string, targetId: number): Observable<{ evaluations: Evaluation[] }> {
    return this.http.get<{ evaluations: Evaluation[] }>(`${this.base}/api/evaluations`, {
      params: new HttpParams().set('targetType', targetType).set('targetId', targetId.toString())
    });
  }

  createEvaluation(payload: CreateEvaluationPayload): Observable<{ evaluation: Evaluation }> {
    return this.http.post<{ evaluation: Evaluation }>(`${this.base}/api/evaluations`, payload);
  }

  updateEvaluation(id: number, payload: UpdateEvaluationPayload): Observable<{ evaluation: Evaluation }> {
    return this.http.put<{ evaluation: Evaluation }>(`${this.base}/api/evaluations/${id}`, payload);
  }

  getRecognitionBoard(branchId?: number): Observable<BoardEntry[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId.toString());
    return this.http.get<BoardEntry[]>(`${this.base}/api/recognition/board`, { params });
  }

  getRecognitions(userId?: number): Observable<Recognition[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId.toString());
    return this.http.get<Recognition[]>(`${this.base}/api/recognition`, { params });
  }

  awardRecognition(payload: AwardRecognitionPayload): Observable<{ recognition: Recognition }> {
    return this.http.post<{ recognition: Recognition }>(`${this.base}/api/recognition`, payload);
  }

  getPoints(userId: number): Observable<PointTransaction[]> {
    return this.http.get<PointTransaction[]>(`${this.base}/api/points`, {
      params: new HttpParams().set('userId', userId.toString())
    });
  }

  getNotifications(): Observable<NotificationListResponse> {
    return this.http.get<NotificationListResponse>(`${this.base}/api/notifications`);
  }

  markAllNotificationsRead(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/api/notifications/read-all`, null);
  }

  getMaktabs(): Observable<Maktab[]> {
    return this.http.get<Maktab[]>(`${this.base}/api/maktabs`);
  }

  createMaktab(payload: CreateMaktabPayload): Observable<Maktab> {
    return this.http.post<Maktab>(`${this.base}/api/maktabs`, payload);
  }

  updateMaktab(id: number, payload: UpdateMaktabPayload): Observable<Maktab> {
    return this.http.put<Maktab>(`${this.base}/api/maktabs/${id}`, payload);
  }

  deleteMaktab(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/maktabs/${id}`);
  }

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.base}/api/branches`);
  }

  createBranch(payload: CreateBranchPayload): Observable<Branch> {
    return this.http.post<Branch>(`${this.base}/api/branches`, payload);
  }

  updateBranch(id: number, payload: UpdateBranchPayload): Observable<Branch> {
    return this.http.put<Branch>(`${this.base}/api/branches/${id}`, payload);
  }

  deleteBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/branches/${id}`);
  }

  // ===== Person =====
  getPeople(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.base}/api/people`);
  }
  createPerson(payload: CreatePersonPayload): Observable<Person> {
    return this.http.post<Person>(`${this.base}/api/people`, payload);
  }
  updatePerson(id: number, payload: UpdatePersonPayload): Observable<Person> {
    return this.http.put<Person>(`${this.base}/api/people/${id}`, payload);
  }
  deletePerson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/people/${id}`);
  }

  // ===== Attendance =====
  getAttendance(date?: string): Observable<Attendance[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<Attendance[]>(`${this.base}/api/attendance`, { params });
  }
  setAttendance(payload: SetAttendancePayload): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.base}/api/attendance`, payload);
  }
  getAttendanceHistory(personId?: number, days = 7): Observable<Attendance[]> {
    let params = new HttpParams().set('days', days.toString());
    if (personId) params = params.set('personId', personId.toString());
    return this.http.get<Attendance[]>(`${this.base}/api/attendance/history`, { params });
  }

  // ===== Session =====
  getSessions(): Observable<MorabbiSession[]> {
    return this.http.get<MorabbiSession[]>(`${this.base}/api/sessions`);
  }
  createSession(payload: CreateSessionPayload): Observable<MorabbiSession> {
    return this.http.post<MorabbiSession>(`${this.base}/api/sessions`, payload);
  }
  updateSession(id: number, payload: UpdateSessionPayload): Observable<MorabbiSession> {
    return this.http.put<MorabbiSession>(`${this.base}/api/sessions/${id}`, payload);
  }
  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/sessions/${id}`);
  }

  // ===== Task =====
  getTasks(): Observable<MorabbiTask[]> {
    return this.http.get<MorabbiTask[]>(`${this.base}/api/tasks`);
  }
  createTask(payload: CreateTaskPayload): Observable<MorabbiTask> {
    return this.http.post<MorabbiTask>(`${this.base}/api/tasks`, payload);
  }
  toggleTask(id: number, done: boolean): Observable<MorabbiTask> {
    return this.http.put<MorabbiTask>(`${this.base}/api/tasks/${id}`, { done } as UpdateTaskPayload);
  }
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/tasks/${id}`);
  }

  // ===== DailyTracker =====
  getTracker(days = 7): Observable<DailyTracker[]> {
    return this.http.get<DailyTracker[]>(`${this.base}/api/daily-trackers`, {
      params: new HttpParams().set('days', days.toString())
    });
  }
  upsertTracker(payload: UpsertTrackerPayload): Observable<DailyTracker> {
    return this.http.post<DailyTracker>(`${this.base}/api/daily-trackers`, payload);
  }

  // ===== Methodology =====
  getMethodologies(): Observable<Methodology[]> {
    return this.http.get<Methodology[]>(`${this.base}/api/methodologies`);
  }
  createMethodology(payload: CreateMethodologyPayload): Observable<Methodology> {
    return this.http.post<Methodology>(`${this.base}/api/methodologies`, payload);
  }
  updateMethodology(id: number, payload: UpdateMethodologyPayload): Observable<Methodology> {
    return this.http.put<Methodology>(`${this.base}/api/methodologies/${id}`, payload);
  }
  deleteMethodology(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/methodologies/${id}`);
  }

  // ===== QuranVerse =====
  getQuranVerses(): Observable<QuranVerse[]> {
    return this.http.get<QuranVerse[]>(`${this.base}/api/quran-verses`);
  }
  createQuranVerse(payload: CreateQuranVersePayload): Observable<QuranVerse> {
    return this.http.post<QuranVerse>(`${this.base}/api/quran-verses`, payload);
  }
  updateQuranVerse(id: number, payload: UpdateQuranVersePayload): Observable<QuranVerse> {
    return this.http.put<QuranVerse>(`${this.base}/api/quran-verses/${id}`, payload);
  }
  deleteQuranVerse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/quran-verses/${id}`);
  }

  // ===== Hadith =====
  getHadiths(): Observable<MorabbiHadith[]> {
    return this.http.get<MorabbiHadith[]>(`${this.base}/api/hadiths`);
  }
  createHadith(payload: CreateHadithPayload): Observable<MorabbiHadith> {
    return this.http.post<MorabbiHadith>(`${this.base}/api/hadiths`, payload);
  }
  updateHadith(id: number, payload: UpdateHadithPayload): Observable<MorabbiHadith> {
    return this.http.put<MorabbiHadith>(`${this.base}/api/hadiths/${id}`, payload);
  }
  deleteHadith(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/hadiths/${id}`);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    this.isAuthenticated.set(false);
  }

  hasRole(...roles: string[]): boolean {
    const u = this.user();
    if (!u || !u.role) return false;
    const current = u.role.toLowerCase();
    return roles.some((r) => r.toLowerCase() === current);
  }

  isStaff(): boolean {
    return this.hasRole('admin', 'manager', 'branch_manager', 'evaluator', 'brothers_skills_supervisor', 'sisters_skills_supervisor');
  }

  canEvaluate(): boolean {
    return this.hasRole('evaluator', 'branch_manager', 'manager', 'admin');
  }

  isAdminManager(): boolean {
    return this.hasRole('admin', 'manager');
  }

  canApprove(): boolean {
    return this.hasRole('admin', 'manager', 'branch_manager');
  }

  private restoreUser(): AuthUserDto | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUserDto) : null;
    } catch {
      return null;
    }
  }
}
