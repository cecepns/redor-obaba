import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Public & Member Pages
import Home from './pages/Home';
import BloodStock from './pages/BloodStock';
import BloodRequests from './pages/BloodRequests';
import RequestDetail from './pages/RequestDetail';
import ConfirmDonorResponse from './pages/ConfirmDonorResponse';
import Donations from './pages/Donations';
import DonorGallery from './pages/DonorGallery';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import ScheduleEvents from './pages/ScheduleEvents';
import HospitalsDirectory from './pages/HospitalsDirectory';
import Profile from './pages/Profile';
import DonorCardPage from './pages/DonorCardPage';
import DonorHistory from './pages/DonorHistory';
import Feedback from './pages/Feedback';
import HelpFAQ from './pages/HelpFAQ';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDonors from './pages/admin/AdminDonors';
import AdminRequests from './pages/admin/AdminRequests';
import AdminActivities from './pages/admin/AdminActivities';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminHospitals from './pages/admin/AdminHospitals';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminWAGateway from './pages/admin/AdminWAGateway';
import AdminGallery from './pages/admin/AdminGallery';
import AdminBanners from './pages/admin/AdminBanners';

// Protected Admin Route Helper
const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protected Member Route Helper
const ProtectedMemberRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '16px',
              padding: '12px 18px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />

        <Routes>
          {/* Main User App Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="stock" element={<BloodStock />} />
            <Route path="requests" element={<BloodRequests />} />
            <Route path="requests/:id" element={<RequestDetail />} />
            <Route path="confirm-request/:id" element={<ConfirmDonorResponse />} />
            <Route path="activities" element={<Activities />} />
            <Route path="activities/:slug" element={<ActivityDetail />} />
            <Route path="schedules" element={<ScheduleEvents />} />
            <Route path="donations" element={<Donations />} />
            <Route path="gallery" element={<DonorGallery />} />
            <Route path="hospitals" element={<HospitalsDirectory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="donor-card" element={<DonorCardPage />} />
            <Route path="history" element={<ProtectedMemberRoute><DonorHistory /></ProtectedMemberRoute>} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="help" element={<HelpFAQ />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Admin Protected Routes with Dedicated Admin Layout */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="donors" element={<AdminDonors />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="schedules" element={<AdminSchedules />} />
            <Route path="hospitals" element={<AdminHospitals />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="wa-gateway" element={<AdminWAGateway />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
