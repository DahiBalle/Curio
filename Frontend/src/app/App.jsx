import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProfilePage } from '../features/profile';
import { Sidebar } from '../components/layout/Sidebar';
import { SearchOverlay } from '../components/layout/SearchOverlay';
import { SignupPage, LoginPage } from '../features/auth';
import { HomePage } from '../features/feed';
import './App.css';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Routes that need the Sidebar layout */}
      <Route path="/*" element={
        <div className="app-layout">
          <Sidebar onSearchClick={() => setIsSearchOpen(true)} />

          <div className="app-main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </div>

          {isSearchOpen && (
            <SearchOverlay onClose={() => setIsSearchOpen(false)} />
          )}
        </div>
      } />
    </Routes>
  );
}

export default App;
