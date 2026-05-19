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

  return (
    <DateRangeContext.Provider value={{ startDate, endDate }}>
      <div className="space-y-6">
        <DateRangeFilter onFilterChange={handleFilterChange} onExport={handleExport} />
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="progress">{t('analytics.progress.title')}</TabsTrigger>
            <TabsTrigger value="students">{t('analytics.students.title')}</TabsTrigger>
            <TabsTrigger value="errors">{t('analytics.errors.title')}</TabsTrigger>
            <TabsTrigger value="engagement">{t('analytics.engagement.title')}</TabsTrigger>
            <TabsTrigger value="churn">{t('analytics.churn.title')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('analytics.alerts.title')}</TabsTrigger>
            <TabsTrigger value="class">{t('analytics.classReport.title')}</TabsTrigger>
            <TabsTrigger value="skills">{t('admin.tabs.skills')}</TabsTrigger>
            <TabsTrigger value="funnel">{t('admin.tabs.funnel')}</TabsTrigger>
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
          </TabsList>
          
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

          <TabsContent value="funnel" className="space-y-6">
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
