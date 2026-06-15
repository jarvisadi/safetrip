import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteProfile from './pages/CompleteProfile';
import TouristDashboard from './pages/TouristDashboard';
import TouristSOS from './pages/TouristSOS';
import TouristProfile from './pages/TouristProfile';
import AdminMap from './pages/AdminMap';
import AdminIncidents from './pages/AdminIncidents';
import AdminAnalytics from './pages/AdminAnalytics';
import GovPortal from './pages/GovPortal';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/tourist/complete-profile"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <Navbar />
              <CompleteProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tourist/dashboard"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <Navbar />
              <TouristDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tourist/sos"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <Navbar />
              <TouristSOS />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tourist/profile"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <Navbar />
              <TouristProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/map"
          element={
            <ProtectedRoute allowedRoles={['admin', 'govt']}>
              <Navbar />
              <AdminMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/incidents"
          element={
            <ProtectedRoute allowedRoles={['admin', 'govt']}>
              <Navbar />
              <AdminIncidents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin', 'govt']}>
              <Navbar />
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gov/portal"
          element={
            <ProtectedRoute allowedRoles={['govt']}>
              <Navbar />
              <GovPortal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
