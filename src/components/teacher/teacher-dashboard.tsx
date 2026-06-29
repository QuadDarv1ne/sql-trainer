'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import TeacherStatsCards from './teacher-stats-cards';
import StudentProgressTable from './student-progress';
import StudentEngagement from './student-engagement';
import ClassAnalytics from './class-analytics';
import TeacherAlerts from './teacher-alerts';
import ChurnPredictionTable from '../admin/analytics/churn-prediction';
import TeacherExportDialog from './teacher-export-dialog';
import TeacherCohortAnalysis from './teacher-cohort-analysis';
import TeacherRecommendations from './teacher-recommendations';
import SkillBreakdownChart from '../admin/analytics/skill-breakdown-chart';
import CompletionFunnelChart from '../admin/analytics/completion-funnel-chart';
import MasteryProgressionChart from '../admin/analytics/mastery-progression-chart';
import GradeDistributionChart from '../admin/analytics/grade-distribution-chart';
import StudentGrowthTrends from '../admin/analytics/student-growth-trends';
import { TeacherDeadlineManager } from './deadline-manager';
import GroupManagement from './group-management';
import { t } from '@/lib/i18n';

export default function TeacherDashboard() {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="outline" onClick={() => setExportOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          {t('teacher.export.title')}
        </Button>
      </div>

      <TeacherStatsCards />

      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="progress">{t('teacher.tabs.progress')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('teacher.tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('teacher.tabs.engagement')}</TabsTrigger>
          <TabsTrigger value="cohorts">{t('teacher.tabs.cohorts')}</TabsTrigger>
          <TabsTrigger value="churn">{t('teacher.tabs.churn')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('teacher.tabs.alerts')}</TabsTrigger>
          <TabsTrigger value="recommendations">{t('teacher.tabs.recommendations')}</TabsTrigger>
          <TabsTrigger value="skills">{t('admin.tabs.skills')}</TabsTrigger>
          <TabsTrigger value="funnel">{t('admin.tabs.funnel')}</TabsTrigger>
          <TabsTrigger value="mastery">{t('admin.tabs.mastery')}</TabsTrigger>
          <TabsTrigger value="grade">{t('teacher.tabs.grade')}</TabsTrigger>
          <TabsTrigger value="growth">{t('teacher.tabs.growth')}</TabsTrigger>
          <TabsTrigger value="deadlines">{t('teacher.tabs.deadlines')}</TabsTrigger>
          <TabsTrigger value="groups">{t('teacher.tabs.groups', { default: 'Groups' })}</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          <StudentProgressTable />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ClassAnalytics />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <StudentEngagement />
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-6">
          <TeacherCohortAnalysis />
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          <ChurnPredictionTable apiEndpoint="/api/teacher/churn-prediction" />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <TeacherAlerts />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <TeacherRecommendations />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <SkillBreakdownChart apiEndpoint="/api/teacher/skills" />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <CompletionFunnelChart apiEndpoint="/api/teacher/funnel" />
        </TabsContent>

        <TabsContent value="mastery" className="space-y-6">
          <MasteryProgressionChart apiEndpoint="/api/teacher/mastery" />
        </TabsContent>

        <TabsContent value="grade" className="space-y-6">
          <GradeDistributionChart apiEndpoint="/api/teacher/grade" />
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <StudentGrowthTrends apiEndpoint="/api/teacher/growth" />
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <TeacherDeadlineManager />
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <GroupManagement />
        </TabsContent>
      </Tabs>

      <TeacherExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
