// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import NoteDetail from "./components/NoteDetail";
import NewNote from "./components/NewNote";
import PrivateRoute from "./auth/PrivateRoute";
import Layout from "./components/Layout";
import PageTransition from "./components/pagetransition"; // Import the PageTransition component
import EditNote from "./components/EditNote";

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/note/:noteId"
              element={
                <PrivateRoute>
                  <NoteDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/new-note"
              element={
                <PrivateRoute>
                  <NewNote />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-note/:noteId"
              element={
                <PrivateRoute>
                  <EditNote />
                </PrivateRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default App;
