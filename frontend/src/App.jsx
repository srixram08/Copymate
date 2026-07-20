import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import ShopDashboard from './pages/ShopDashboard.jsx';
import DeliveryDashboard from './pages/DeliveryDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const cachedUser = localStorage.getItem('user');

  if (!token || !cachedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(cachedUser);
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Customer Routes */}
        <Route 
          path="/customer" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Shop Owner Routes */}
        <Route 
          path="/shop" 
          element={
            <ProtectedRoute allowedRoles={['shop_owner', 'admin']}>
              <ShopDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Delivery Agent Routes */}
        <Route 
          path="/delivery" 
          element={
            <ProtectedRoute allowedRoles={['delivery_agent']}>
              <DeliveryDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
