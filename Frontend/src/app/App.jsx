import { AuthProvider } from '../context/AuthContext';
import { PersonaProvider } from '../context/PersonaContext';
import { AppRouter } from './router';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <PersonaProvider>
        <AppRouter />
      </PersonaProvider>
    </AuthProvider>
  );
}

export default App;

