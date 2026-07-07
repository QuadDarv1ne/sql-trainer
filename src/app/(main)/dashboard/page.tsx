import dynamic from 'next/dynamic';

const StudentDashboard = dynamic(() => import('@/components/student/student-dashboard'), {
  loading: () => <div className="h-64 animate-pulse rounded-md bg-muted" />,
});

export default function DashboardPage() {
  return <StudentDashboard />;
}
