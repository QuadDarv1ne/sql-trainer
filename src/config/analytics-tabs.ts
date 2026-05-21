/**
 * Configuration-driven tab registry for the analytics dashboard.
 * Replaces hardcoded TabsTrigger/TabsContent pairs.
 */
import { LucideIcon, LayoutDashboard, Users, TrendingUp, Activity, AlertTriangle, Target, BookOpen, Award, BarChart3, Clock, PieChart, FileText, Settings, Zap, Search, Eye, Calendar, GitBranch, Lightbulb, Shield, Mail, Flame, UserPlus, CalendarDays, Timer, BarChart, MessageSquare } from 'lucide-react';

export type TabCategory = 'general' | 'students' | 'performance' | 'engagement' | 'system';

export interface AnalyticsTabConfig {
  id: string;
  /** Translation key for the tab label */
  labelKey: string;
  /** Icon for the tab */
  icon: LucideIcon;
  /** Category for grouping/filtering */
  category: TabCategory;
  /** Optional: comma-separated list of component names rendered in this tab */
  components?: string;
}

export const categoryLabels: Record<TabCategory, string> = {
  general: 'Общая аналитика',
  students: 'Студенты',
  performance: 'Успеваемость',
  engagement: 'Вовлечённость',
  system: 'Система',
};

export const categoryIcons: Record<TabCategory, LucideIcon> = {
  general: LayoutDashboard,
  students: Users,
  performance: TrendingUp,
  engagement: Activity,
  system: Settings,
};

export const analyticsTabs: AnalyticsTabConfig[] = [
  // General / Overview
  { id: 'overview', labelKey: 'admin.tabs.overview', icon: LayoutDashboard, category: 'general', components: 'WeekOverWeek, PerformanceMetrics, ActivityChart, TaskAnalytics, Distribution, TimeToComplete, Difficulty, Achievements' },
  { id: 'activity-summary', labelKey: 'admin.tabs.activitySummary', icon: BarChart, category: 'general', components: 'ActivitySummary' },
  { id: 'registrations', labelKey: 'admin.tabs.registrations', icon: UserPlus, category: 'general', components: 'RegistrationTrends' },

  // Students
  { id: 'students', labelKey: 'analytics.students.title', icon: Users, category: 'students', components: 'StudentPerformanceCards' },
  { id: 'leaderboard', labelKey: 'admin.tabs.leaderboard', icon: Award, category: 'students', components: 'LeaderboardTable' },
  { id: 'comparison', labelKey: 'admin.tabs.comparison', icon: GitBranch, category: 'students', components: 'StudentComparison' },
  { id: 'groups', labelKey: 'admin.tabs.groups', icon: Users, category: 'students', components: 'StudentGroupsChart' },

  // Performance
  { id: 'progress', labelKey: 'analytics.progress.title', icon: TrendingUp, category: 'performance', components: 'Heatmap, LearningPace, ProgressTracking, CohortAnalysis' },
  { id: 'skills', labelKey: 'admin.tabs.skills', icon: BookOpen, category: 'performance', components: 'SkillBreakdown' },
  { id: 'funnel', labelKey: 'admin.tabs.funnel', icon: BarChart3, category: 'performance', components: 'CompletionFunnel' },
  { id: 'mastery', labelKey: 'admin.tabs.mastery', icon: Target, category: 'performance', components: 'MasteryProgression' },
  { id: 'grade', labelKey: 'admin.tabs.grade', icon: PieChart, category: 'performance', components: 'GradeDistribution' },
  { id: 'grades', labelKey: 'admin.tabs.grades', icon: FileText, category: 'performance', components: 'PredictiveGrades, PeerComparison' },
  { id: 'growth', labelKey: 'admin.tabs.growth', icon: TrendingUp, category: 'performance', components: 'StudentGrowthTrends' },
  { id: 'cohort-comparison', labelKey: 'admin.tabs.cohortComparison', icon: GitBranch, category: 'performance', components: 'CohortComparison' },
  { id: 'topics', labelKey: 'admin.tabs.topics', icon: BookOpen, category: 'performance', components: 'TopicPerformance, CategoryPerformance' },
  { id: 'task-performance', labelKey: 'admin.tabs.taskPerformance', icon: BarChart3, category: 'performance', components: 'TaskPerformanceDetail' },
  { id: 'path-analysis', labelKey: 'admin.tabs.pathAnalysis', icon: GitBranch, category: 'performance', components: 'LearningPath, Bottlenecks, HintImpact' },
  { id: 'retention-cohorts', labelKey: 'admin.tabs.retentionCohorts', icon: Users, category: 'performance', components: 'RetentionCohorts' },
  { id: 'topic-mastery', labelKey: 'admin.tabs.topicMastery', icon: Target, category: 'performance', components: 'TopicMastery' },

  // Errors & Sessions
  { id: 'errors', labelKey: 'analytics.errors.title', icon: AlertTriangle, category: 'performance', components: 'ErrorTrends, ErrorPatterns' },
  { id: 'sessions', labelKey: 'admin.tabs.sessions', icon: Eye, category: 'performance', components: 'SessionAnalysis' },
  { id: 'time-patterns', labelKey: 'admin.tabs.timePatterns', icon: Clock, category: 'performance', components: 'TimePatterns' },
  { id: 'weekday', labelKey: 'admin.tabs.weekday', icon: Calendar, category: 'performance', components: 'WeekdayComparison' },

  // Engagement
  { id: 'engagement', labelKey: 'analytics.engagement.title', icon: Activity, category: 'engagement', components: 'EngagementMetrics' },
  { id: 'churn', labelKey: 'analytics.churn.title', icon: AlertTriangle, category: 'engagement', components: 'ChurnPrediction' },
  { id: 'streaks', labelKey: 'admin.tabs.streaks', icon: Flame, category: 'engagement', components: 'StreakAnalytics' },
  { id: 'onboarding', labelKey: 'admin.tabs.onboarding', icon: UserPlus, category: 'engagement', components: 'OnboardingFunnel' },
  { id: 're-engagement', labelKey: 'admin.tabs.reEngagement', icon: Zap, category: 'engagement', components: 'ReEngagement' },
  { id: 'hint-usage', labelKey: 'analytics.hintUsage.title', icon: Lightbulb, category: 'engagement', components: 'HintUsageAnalytics' },

  // System & Admin
  { id: 'alerts', labelKey: 'analytics.alerts.title', icon: AlertTriangle, category: 'system', components: 'Alerts, Recommendations' },
  { id: 'class', labelKey: 'analytics.classReport.title', icon: FileText, category: 'system', components: 'ClassReport' },
  { id: 'health', labelKey: 'admin.tabs.health', icon: Settings, category: 'system', components: 'SystemHealth' },
  { id: 'deadline-compliance', labelKey: 'admin.tabs.deadlineCompliance', icon: CalendarDays, category: 'system', components: 'DeadlineCompliance' },
  { id: 'notifications', labelKey: 'admin.tabs.notifications', icon: Mail, category: 'system', components: 'NotificationAnalytics' },
  { id: 'calibration', labelKey: 'admin.tabs.calibration', icon: Settings, category: 'system', components: 'DifficultyCalibration' },
  { id: 'audit', labelKey: 'admin.tabs.audit', icon: Shield, category: 'system', components: 'AuditLog' },
  { id: 'live', labelKey: 'admin.tabs.live', icon: Activity, category: 'system', components: 'LiveActivity' },

  // Advanced
  { id: 'learning-plan', labelKey: 'admin.tabs.learningPlan', icon: BookOpen, category: 'performance', components: 'LearningPlan' },
  { id: 'ab-test', labelKey: 'admin.tabs.abTest', icon: BarChart3, category: 'performance', components: 'ABTest' },
  { id: 'teacher-effectiveness', labelKey: 'admin.tabs.teacherEffectiveness', icon: Users, category: 'system', components: 'TeacherEffectiveness' },
];

/** Group tabs by category for the sidebar navigation */
export function getTabsByCategory(): Record<TabCategory, AnalyticsTabConfig[]> {
  const grouped: Record<TabCategory, AnalyticsTabConfig[]> = {
    general: [],
    students: [],
    performance: [],
    engagement: [],
    system: [],
  };
  for (const tab of analyticsTabs) {
    grouped[tab.category].push(tab);
  }
  return grouped;
}

/** Get all tab IDs for export section sync */
export function getAllTabIds(): string[] {
  return analyticsTabs.map((t) => t.id);
}
