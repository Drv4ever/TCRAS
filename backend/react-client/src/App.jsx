import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Transfer from './pages/Transfer';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-cyber-dark">
        {/* Navigation */}
        <nav className="glass border-b border-gray-700/50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-lg flex items-center justify-center shadow-glow-blue">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-white">
                  TCRAS
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Transfer Security</p>
              </div>
            </div>

            <div className="flex space-x-6">
              <Link
                to="/"
                className="text-gray-300 hover:text-cyber-blue transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              >
                Transfer
              </Link>
              <Link
                to="/dashboard"
                className="text-gray-300 hover:text-cyber-blue transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Transfer />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
