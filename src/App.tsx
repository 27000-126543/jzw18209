import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage from '@/pages/HomePage';
import HabitsPage from '@/pages/HabitsPage';
import CreateHabitPage from '@/pages/CreateHabitPage';
import HabitDetailPage from '@/pages/HabitDetailPage';
import CheckInPage from '@/pages/CheckInPage';
import ExplorePage from '@/pages/ExplorePage';
import TeamsPage from '@/pages/TeamsPage';
import CreateTeamPage from '@/pages/CreateTeamPage';
import TeamDetailPage from '@/pages/TeamDetailPage';
import ProfilePage from '@/pages/ProfilePage';
import UserProfilePage from '@/pages/UserProfilePage';
import NotificationsPage from '@/pages/NotificationsPage';
import BadgesPage from '@/pages/BadgesPage';
import NotFound from '@/pages/NotFound';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/habits/create" element={<CreateHabitPage />} />
          <Route path="/habits/:id/edit" element={<CreateHabitPage />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="/habits/:id/checkin" element={<CheckInPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/create" element={<CreateTeamPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/messages" element={<NotificationsPage />} />
          <Route path="/badges" element={<BadgesPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
