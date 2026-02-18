import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import AdminLayout from "@/components/AdminLayout";

// Auth pages
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import ProfileSetup from "@/pages/ProfileSetup";

// User pages
import Dashboard from "@/pages/Dashboard";
import Lessons from "@/pages/Lessons";
import LessonDetail from "@/pages/LessonDetail";
import Wiki from "@/pages/Wiki";
import Prompts from "@/pages/Prompts";
import QA from "@/pages/QA";
import QuestionDetail from "@/pages/QuestionDetail";
import Profile from "@/pages/Profile";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLessons from "@/pages/admin/AdminLessons";
import AdminWiki from "@/pages/admin/AdminWiki";
import AdminPrompts from "@/pages/admin/AdminPrompts";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminUsers from "@/pages/admin/AdminUsers";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />

            {/* Profile setup (protected, any auth'd user) */}
            <Route
              path="/profile-setup"
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />

            {/* Main app routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lessons"
              element={
                <ProtectedRoute>
                  <AppLayout><Lessons /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lessons/:id"
              element={
                <ProtectedRoute>
                  <AppLayout><LessonDetail /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wiki"
              element={
                <ProtectedRoute>
                  <AppLayout><Wiki /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prompts"
              element={
                <ProtectedRoute>
                  <AppLayout><Prompts /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/qa"
              element={
                <ProtectedRoute>
                  <AppLayout><QA /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/qa/:id"
              element={
                <ProtectedRoute>
                  <AppLayout><QuestionDetail /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout><Profile /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout><AdminDashboard /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/lessons"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout><AdminLessons /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/wiki"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout><AdminWiki /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/prompts"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout><AdminPrompts /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout><AdminQuestions /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout><AdminUsers /></AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
