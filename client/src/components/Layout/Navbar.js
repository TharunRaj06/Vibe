import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Car, User, FileText, Home, LogOut } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Mock user state - in real app this would come from context/redux
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Car className="brand-icon" />
          <span>AutoClaimAI</span>
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            <Home size={18} />
            Home
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <FileText size={18} />
                Dashboard
              </Link>
              <Link to="/submit-claim" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <FileText size={18} />
                Submit Claim
              </Link>
              <Link to="/claims" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <FileText size={18} />
                My Claims
              </Link>
              <Link to="/profile" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                Profile
              </Link>
              <button className="navbar-link logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <User size={18} />
                Login
              </Link>
              <Link to="/register" className="navbar-link navbar-cta" onClick={() => setIsMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>

        <button className="navbar-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
