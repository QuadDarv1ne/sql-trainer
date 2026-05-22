'use client';

import { useState, createContext, useContext } from 'react';
import ActivityChart from './analytics/activity-chart';
import PerformanceMetrics from './analytics/performance-metrics';
import TaskAnalyticsChart from './analytics/task-analytics-chart';
import CompletionDistributionChart from './analytics/completion-distribution-chart';
import AchievementAnalytics from './analytics/achievement-analytics';
import ProgressTrackingChart from './analytics/progress-tracking-chart';
import CohortAnalysisTable from './analytics/cohort-analysis';
import DifficultyComparisonChart from './analytics/difficulty-comparison';
import StudentPerformanceCards from './analytics/student-performance-cards';
import DateRangeFilter from './analytics/date-range-filter';
import AlertsPanel from './analytics/alerts-panel';
import RecommendationsPanel from './analytics/recommendations-panel';
import ClassReport from './analytics/class-report';
import ErrorPatternsTable from './analytics/error-patterns';
import EngagementMetrics from './analytics/engagement-metrics';
import ChurnPredictionTable from './analytics/churn-prediction';
import ExportDialog from './analytics/export-dialog';
import WeekOverWeekComparison from './analytics/week-comparison';
import ActivityHeatmap from './analytics/activity-heatmap';
import TimeToCompleteChart from './analytics/time-to-complete-chart';
import SkillBreakdownChart from './analytics/skill-breakdown-chart';
import CompletionFunnelChart from './analytics/completion-funnel-chart';
import MasteryProgressionChart from './analytics/mastery-progression-chart';
import StudentComparison from './analytics/student-comparison';
import LeaderboardTable from './analytics/leaderboard-table';
import SystemHealth from './system-health';
import GradeDistributionChart from './analytics/grade-distribution-chart';
import StudentGrowthTrends from './analytics/student-growth-trends';
import LearningPaceChart from './analytics/learning-pace-chart';
import ErrorTrendsChart from './analytics/error-trends-chart';
import CohortComparisonChart from './analytics/cohort-comparison-chart';
import TaskPerformanceChart from './analytics/task-performance-chart';
import TimePatternsChart from './analytics/time-patterns-chart';
import StudentGroupsChart from './analytics/student-groups-chart';
import TopicPerformanceChart from './analytics/topic-performance-chart';
import PredictiveGradesTable from './analytics/predictive-grades-table';
import LearningPathChart from './analytics/learning-path-chart';
import BottleneckAnalysis from './analytics/bottleneck-analysis';
import PeerComparisonMatrix from './analytics/peer-comparison-matrix';
import CategoryPerformanceChart from './analytics/category-performance-chart';
import SessionAnalysisChart from './analytics/session-analysis-chart';
import HintImpactChart from './analytics/hint-impact-chart';
import DeadlineCompliance from './analytics/deadline-compliance';
import NotificationAnalytics from './analytics/notification-analytics';
import StreakAnalytics from './analytics/streak-analytics';
import OnboardingFunnel from './analytics/onboarding-funnel';
import ReEngagement from './analytics/re-engagement';
import DifficultyCalibration from './analytics/difficulty-calibration';
import RegistrationTrends from './analytics/registration-trends';
import ActivitySummary from './analytics/activity-summary';
import HintUsageAnalytics from './analytics/hint-usage-analytics';
import AuditLog from './analytics/audit-log';
import WeekdayComparison from './analytics/weekday-comparison';
import LiveActivity from './analytics/live-activity';
import LearningPlan from './analytics/learning-plan';
import ABTest from './analytics/ab-test';
import TeacherEffectiveness from './analytics/teacher-effectiveness';
import RetentionCohorts from './analytics/retention-cohorts';
import TopicMastery from './analytics/topic-mastery';
import ExecutiveSummary from './analytics/executive-summary';
import PlatformHealthReport from './analytics/platform-health';
import ContentPerformance from './analytics/content-performance';
import RegistrationFunnel from './analytics/registration-funnel';
import AggregatePerformance from './analytics/aggregate-performance';
import AtRiskStudents from './analytics/at-risk-students';
import SkillGapMatrix from './analytics/skill-gap-matrix';
import AcademicTimeline from './analytics/academic-timeline';
import StudyPatterns from './analytics/study-patterns';
import AttemptEfficiency from './analytics/attempt-efficiency';
import StudentComparisonDashboard from './analytics/student-comparison-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/lib/i18n';

interface DateRangeContextValue {
  startDate: number | null;
  endDate: number | null;
}

const DateRangeContext = createContext<DateRangeContextValue>({
  startDate: null,
  endDate: null,
});

export function useDateRange() {
  return useContext(DateRangeContext);
}

export default function AnalyticsDashboard() {
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const handleFilterChange = (start: number | null, end: number | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleExport = () => {
    setExportOpen(true);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <DateRangeContext.Provider value={{ startDate, endDate }}>
      <div className="space-y-6">
        <DateRangeFilter onFilterChange={handleFilterChange} onExport={handleExport} onRefresh={handleRefresh} />
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="executive">{t('analytics.executiveSummary.title')}</TabsTrigger>
            <TabsTrigger value="platform-health">{t('analytics.platformHealth.title')}</TabsTrigger>
            <TabsTrigger value="content">{t('analytics.contentPerformance.title')}</TabsTrigger>
            <TabsTrigger value="funnel">{t('analytics.registrationFunnel.title')}</TabsTrigger>
            <TabsTrigger value="aggregate">{t('analytics.aggregatePerformance.title')}</TabsTrigger>
            <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="progress">{t('analytics.progress.title')}</TabsTrigger>
            <TabsTrigger value="students">{t('analytics.students.title')}</TabsTrigger>
            <TabsTrigger value="errors">{t('analytics.errors.title')}</TabsTrigger>
            <TabsTrigger value="engagement">{t('analytics.engagement.title')}</TabsTrigger>
            <TabsTrigger value="churn">{t('analytics.churn.title')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('analytics.alerts.title')}</TabsTrigger>
            <TabsTrigger value="class">{t('analytics.classReport.title')}</TabsTrigger>
            <TabsTrigger value="skills">{t('admin.tabs.skills')}</TabsTrigger>
            <TabsTrigger value="completion-funnel">{t('admin.tabs.funnel')}</TabsTrigger>
            <TabsTrigger value="mastery">{t('admin.tabs.mastery')}</TabsTrigger>
            <TabsTrigger value="leaderboard">{t('admin.tabs.leaderboard')}</TabsTrigger>
            <TabsTrigger value="health">{t('admin.tabs.health')}</TabsTrigger>
            <TabsTrigger value="grade">{t('admin.tabs.grade')}</TabsTrigger>
            <TabsTrigger value="growth">{t('admin.tabs.growth')}</TabsTrigger>
            <TabsTrigger value="cohort-comparison">{t('admin.tabs.cohortComparison')}</TabsTrigger>
            <TabsTrigger value="task-performance">{t('admin.tabs.taskPerformance')}</TabsTrigger>
            <TabsTrigger value="time-patterns">{t('admin.tabs.timePatterns')}</TabsTrigger>
            <TabsTrigger value="groups">{t('admin.tabs.groups')}</TabsTrigger>
            <TabsTrigger value="comparison">{t('admin.tabs.comparison')}</TabsTrigger>
            <TabsTrigger value="topics">{t('admin.tabs.topics')}</TabsTrigger>
            <TabsTrigger value="grades">{t('admin.tabs.grades')}</TabsTrigger>
            <TabsTrigger value="path-analysis">{t('admin.tabs.pathAnalysis')}</TabsTrigger>
            <TabsTrigger value="sessions">{t('admin.tabs.sessions')}</TabsTrigger>
            <TabsTrigger value="deadline-compliance">{t('admin.tabs.deadlineCompliance')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('admin.tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="streaks">{t('admin.tabs.streaks')}</TabsTrigger>
            <TabsTrigger value="onboarding">{t('admin.tabs.onboarding')}</TabsTrigger>
            <TabsTrigger value="re-engagement">{t('admin.tabs.reEngagement')}</TabsTrigger>
            <TabsTrigger value="calibration">{t('admin.tabs.calibration')}</TabsTrigger>
            <TabsTrigger value="registrations">{t('admin.tabs.registrations')}</TabsTrigger>
            <TabsTrigger value="activity-summary">{t('admin.tabs.activitySummary')}</TabsTrigger>
            <TabsTrigger value="audit">{t('admin.tabs.audit')}</TabsTrigger>
            <TabsTrigger value="weekday">{t('admin.tabs.weekday')}</TabsTrigger>
            <TabsTrigger value="hint-usage">{t('analytics.hintUsage.title')}</TabsTrigger>
            <TabsTrigger value="live">{t('admin.tabs.live')}</TabsTrigger>
            <TabsTrigger value="learning-plan">{t('admin.tabs.learningPlan')}</TabsTrigger>
            <TabsTrigger value="ab-test">{t('admin.tabs.abTest')}</TabsTrigger>
            <TabsTrigger value="teacher-effectiveness">{t('admin.tabs.teacherEffectiveness')}</TabsTrigger>
            <TabsTrigger value="retention-cohorts">{t('admin.tabs.retentionCohorts')}</TabsTrigger>
            <TabsTrigger value="topic-mastery">{t('admin.tabs.topicMastery')}</TabsTrigger>
            <TabsTrigger value="at-risk">{t('admin.tabs.atRisk')}</TabsTrigger>
            <TabsTrigger value="skill-gap">{t('admin.tabs.skillGap')}</TabsTrigger>
            <TabsTrigger value="academic-timeline">{t('admin.tabs.academicTimeline')}</TabsTrigger>
            <TabsTrigger value="study-patterns">{t('admin.tabs.studyPatterns')}</TabsTrigger>
            <TabsTrigger value="attempt-efficiency">{t('admin.tabs.attemptEfficiency')}</TabsTrigger>
            <TabsTrigger value="student-comparison">{t('admin.tabs.studentComparison')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="executive" className="space-y-6">
            <ExecutiveSummary />
          </TabsContent>

          <TabsContent value="platform-health" className="space-y-6">
            <PlatformHealthReport />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <ContentPerformance />
          </TabsContent>

          <TabsContent value="funnel" className="space-y-6">
            <RegistrationFunnel />
          </TabsContent>

          <TabsContent value="aggregate" className="space-y-6">
            <AggregatePerformance />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <WeekOverWeekComparison />
            <PerformanceMetrics />
            <ActivityChart />
            <div className="grid gap-6 lg:grid-cols-2">
              <TaskAnalyticsChart />
              <CompletionDistributionChart />
            </div>
            <TimeToCompleteChart />
            <DifficultyComparisonChart />
            <AchievementAnalytics />
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-6">
            <ActivityHeatmap />
            <LearningPaceChart />
            <ProgressTrackingChart />
            <CohortAnalysisTable />
          </TabsContent>
          
          <TabsContent value="students" className="space-y-6">
            <StudentPerformanceCards />
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-6">
            <ErrorTrendsChart />
            <ErrorPatternsTable />
          </TabsContent>
          
          <TabsContent value="engagement" className="space-y-6">
            <EngagementMetrics />
          </TabsContent>
          
          <TabsContent value="churn" className="space-y-6">
            <ChurnPredictionTable />
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-6">
            <AlertsPanel />
            <RecommendationsPanel />
          </TabsContent>
          
          <TabsContent value="class" className="space-y-6">
            <ClassReport />
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <SkillBreakdownChart />
          </TabsContent>

          <TabsContent value="completion-funnel" className="space-y-6">
            <CompletionFunnelChart />
          </TabsContent>

          <TabsContent value="mastery" className="space-y-6">
            <MasteryProgressionChart />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <LeaderboardTable />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <SystemHealth />
          </TabsContent>

          <TabsContent value="grade" className="space-y-6">
            <GradeDistributionChart />
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <StudentGrowthTrends />
          </TabsContent>

          <TabsContent value="cohort-comparison" className="space-y-6">
            <CohortComparisonChart />
          </TabsContent>

          <TabsContent value="task-performance" className="space-y-6">
            <TaskPerformanceChart />
          </TabsContent>

          <TabsContent value="time-patterns" className="space-y-6">
            <TimePatternsChart />
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <StudentGroupsChart />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <StudentComparison />
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <TopicPerformanceChart />
            <CategoryPerformanceChart />
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <PredictiveGradesTable />
            <PeerComparisonMatrix />
          </TabsContent>

          <TabsContent value="path-analysis" className="space-y-6">
            <LearningPathChart />
            <BottleneckAnalysis />
            <HintImpactChart />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <SessionAnalysisChart />
          </TabsContent>

          <TabsContent value="deadline-compliance" className="space-y-6">
            <DeadlineCompliance />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationAnalytics />
          </TabsContent>

          <TabsContent value="streaks" className="space-y-6">
            <StreakAnalytics />
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <OnboardingFunnel />
          </TabsContent>

          <TabsContent value="re-engagement" className="space-y-6">
            <ReEngagement />
          </TabsContent>

          <TabsContent value="calibration" className="space-y-6">
            <DifficultyCalibration />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-6">
            <RegistrationTrends />
          </TabsContent>

          <TabsContent value="activity-summary" className="space-y-6">
            <ActivitySummary />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLog />
          </TabsContent>

          <TabsContent value="weekday" className="space-y-6">
            <WeekdayComparison />
          </TabsContent>

          <TabsContent value="hint-usage" className="space-y-6">
            <HintUsageAnalytics />
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            <LiveActivity />
          </TabsContent>

          <TabsContent value="learning-plan" className="space-y-6">
            <LearningPlan />
          </TabsContent>

          <TabsContent value="ab-test" className="space-y-6">
            <ABTest />
          </TabsContent>

          <TabsContent value="teacher-effectiveness" className="space-y-6">
            <TeacherEffectiveness />
          </TabsContent>

          <TabsContent value="retention-cohorts" className="space-y-6">
            <RetentionCohorts />
          </TabsContent>

          <TabsContent value="topic-mastery" className="space-y-6">
            <TopicMastery />
          </TabsContent>

          <TabsContent value="at-risk" className="space-y-6">
            <AtRiskStudents />
          </TabsContent>

          <TabsContent value="skill-gap" className="space-y-6">
            <SkillGapMatrix />
          </TabsContent>

          <TabsContent value="academic-timeline" className="space-y-6">
            <AcademicTimeline />
          </TabsContent>

          <TabsContent value="study-patterns" className="space-y-6">
            <StudyPatterns />
          </TabsContent>

          <TabsContent value="attempt-efficiency" className="space-y-6">
            <AttemptEfficiency />
          </TabsContent>

          <TabsContent value="student-comparison" className="space-y-6">
            <StudentComparisonDashboard />
          </TabsContent>
        </Tabs>

        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </DateRangeContext.Provider>
  );
}
