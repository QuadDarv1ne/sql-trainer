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
            <ProgressTrackingChart />
            <CohortAnalysisTable />
          </TabsContent>
          
          <TabsContent value="students" className="space-y-6">
            <StudentPerformanceCards />
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-6">
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
