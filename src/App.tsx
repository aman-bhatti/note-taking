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
import NoteTree from "./components/NoteTree";
import EChartsTreeView from "./components/TreeChart";

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
            <Route
              path="/note-tree"
              element={
                <PrivateRoute>
                  <NoteTree />
                </PrivateRoute>
              }
            />{" "}
            <Route
              path="/tree-view"
              element={
                <PrivateRoute>
                  <EChartsTreeView />
                </PrivateRoute>
              }
            />
            {/* Add NoteTree Route */}
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default App;
