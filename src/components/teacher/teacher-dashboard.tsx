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
      </Tabs>

      <TeacherExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
