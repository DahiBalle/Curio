import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProfilePage } from '../features/profile';
import { Sidebar } from '../components/layout/Sidebar';
import { SearchOverlay } from '../components/layout/SearchOverlay';
import { SignupPage, LoginPage } from '../features/auth';
import { OnboardingPage } from '../features/onboarding';
import { MessagesPage } from '../features/messages';
import { HomePage } from '../features/feed';
import { CreatePostPage, PostDetailPage } from '../features/post';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

export const AppRouter = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Onboarding should be protected (requires user but not onboardingComplete) */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingPage />
        </ProtectedRoute>
      } />

      {/* Routes that need the Sidebar layout */}
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar onSearchClick={() => setIsSearchOpen(true)} />

            <div className="app-main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/create" element={<CreatePostPage />} />
                <Route path="/post/:id" element={<PostDetailPage />} />
              </Routes>
            </div>

            {isSearchOpen && (
              <SearchOverlay onClose={() => setIsSearchOpen(false)} />
            )}
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
};
