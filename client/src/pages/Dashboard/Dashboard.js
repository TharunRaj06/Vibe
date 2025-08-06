import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  TrendingUp,
  Car,
  Camera
} from 'lucide-react';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage (in real app, this would be from auth context)
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchUserData(parsedUser.id);
    } else {
      toast.error('Please log in to access dashboard');
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Fetch recent claims
      const claimsResponse = await fetch(`/api/claims/user/${userId}?limit=5`);
      if (claimsResponse.ok) {
        const claimsData = await claimsResponse.json();
        setRecentClaims(claimsData.claims);
        
        // Calculate stats
        const totalClaims = claimsData.total;
        const pendingClaims = claimsData.claims.filter(claim => claim.status === 'pending').length;
        const approvedClaims = claimsData.claims.filter(claim => claim.status === 'approved').length;
        const totalAmount = claimsData.claims.reduce((sum, claim) => sum + (claim.finalAmount || claim.estimatedAmount || 0), 0);
        
        setStats({
          totalClaims,
          pendingClaims,
          approvedClaims,
          totalAmount
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'under-review':
        return <FileText size={16} className="status-icon review" />;
      case 'approved':
        return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={16} className="status-icon rejected" />;
      default:
        return <Clock size={16} className="status-icon" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-error">
        <h2>Access Denied</h2>
        <p>Please log in to access your dashboard.</p>
        <Link to="/login" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.name}!</h1>
          <p>Manage your insurance claims and track their progress</p>
        </div>
        <Link to="/submit-claim" className="btn btn-primary">
          <Plus size={18} />
          Submit New Claim
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalClaims}</h3>
            <p>Total Claims</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingClaims}</h3>
            <p>Pending Claims</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.approvedClaims}</h3>
            <p>Approved Claims</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amount">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalAmount)}</h3>
            <p>Total Amount</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/submit-claim" className="action-card">
            <Camera size={32} />
            <h3>Submit New Claim</h3>
            <p>Upload photos and submit a new insurance claim</p>
          </Link>

          <Link to="/claims" className="action-card">
            <FileText size={32} />
            <h3>View All Claims</h3>
            <p>Review your complete claims history</p>
          </Link>

          <Link to="/profile" className="action-card">
            <Car size={32} />
            <h3>Update Profile</h3>
            <p>Manage your account information</p>
          </Link>
        </div>
      </div>

      {/* Recent Claims */}
      <div className="recent-claims">
        <div className="section-header">
          <h2>Recent Claims</h2>
          <Link to="/claims" className="view-all-link">
            View All
            <TrendingUp size={16} />
          </Link>
        </div>

        {recentClaims.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No Claims Yet</h3>
            <p>You haven't submitted any claims yet. Start by submitting your first claim.</p>
            <Link to="/submit-claim" className="btn btn-primary">
              Submit First Claim
            </Link>
          </div>
        ) : (
          <div className="claims-list">
            {recentClaims.map((claim) => (
              <Link
                key={claim._id}
                to={`/claim/${claim._id}`}
                className="claim-card"
              >
                <div className="claim-header">
                  <div className="claim-number">
                    <FileText size={16} />
                    {claim.claimNumber}
                  </div>
                  <div className="claim-status">
                    {getStatusIcon(claim.status)}
                    <span className={`status-badge status-${claim.status}`}>
                      {claim.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="claim-details">
                  <p className="claim-description">
                    {claim.incidentDescription.substring(0, 100)}
                    {claim.incidentDescription.length > 100 ? '...' : ''}
                  </p>
                  <div className="claim-meta">
                    <span className="claim-date">
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </span>
                    <span className={`severity-badge severity-${claim.severity}`}>
                      {claim.severity} damage
                    </span>
                    <span className="claim-amount">
                      {formatCurrency(claim.finalAmount || claim.estimatedAmount || 0)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
