import { useState } from 'react';
import { ProfilePage } from '../features/profile';
import { Sidebar } from '../components/layout/Sidebar';
import { SearchOverlay } from '../components/layout/SearchOverlay';
import './App.css';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      
      <div className="app-main-content">
        <ProfilePage />
      </div>

      {isSearchOpen && (
        <SearchOverlay onClose={() => setIsSearchOpen(false)} />
      )}
    </div>
  );
}

export default App;
