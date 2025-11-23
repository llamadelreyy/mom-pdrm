import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme.js';
import MainLayout from './layouts/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ManageAudio from './pages/ManageAudio.jsx';
import ManageTranscript from './pages/ManageTranscript.jsx';
import ManageReports from './pages/ManageReports.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { getStoredValue } from './utils/localStorage.js';

const PrivateRoute = ({ children }) => {
  const token = getStoredValue('token');
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </PrivateRoute>
          } />
          
          <Route path="/manage-audio" element={
            <PrivateRoute>
              <MainLayout>
                <ManageAudio />
              </MainLayout>
            </PrivateRoute>
          } />
          
          <Route path="/manage-transcripts" element={
            <PrivateRoute>
              <MainLayout>
                <ManageTranscript />
              </MainLayout>
            </PrivateRoute>
          } />

          <Route path="/manage-reports" element={
            <PrivateRoute>
              <MainLayout>
                <ManageReports />
              </MainLayout>
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
};

export default App;