import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { TimerPage } from './pages/TimerPage';
import { TimetablePage } from './pages/TimetablePage';
import { BooksPage } from './pages/BooksPage';
import { NotesPage } from './pages/NotesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIPage } from './pages/AIPage';
import { FocusModePage } from './pages/FocusModePage';
import { SettingsPage } from './pages/SettingsPage';
import { RoomsPage } from './pages/RoomsPage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { GuildsPage } from './pages/GuildsPage';
import { GuildDetailPage } from './pages/GuildDetailPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { FriendsPage } from './pages/FriendsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TimerProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
            <Route path="/timer" element={<ProtectedRoute><TimerPage /></ProtectedRoute>} />
            <Route path="/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
            <Route path="/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
            <Route path="/focus" element={<ProtectedRoute><FocusModePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
            <Route path="/rooms/:id" element={<ProtectedRoute><RoomDetailPage /></ProtectedRoute>} />
            <Route path="/guilds" element={<ProtectedRoute><GuildsPage /></ProtectedRoute>} />
            <Route path="/guilds/:id" element={<ProtectedRoute><GuildDetailPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Analytics />
        </TimerProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
