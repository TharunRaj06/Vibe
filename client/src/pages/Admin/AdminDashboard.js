import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [claims, filters]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/claims/admin/all?limit=100');
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims);
        calculateStats(data.claims);
      } else {
        toast.error('Failed to load admin data');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (claimsData) => {
    const totalClaims = claimsData.length;
    const pendingClaims = claimsData.filter(c => c.status === 'pending').length;
    const approvedClaims = claimsData.filter(c => c.status === 'approved').length;
    const rejectedClaims = claimsData.filter(c => c.status === 'rejected').length;
    const totalAmount = claimsData.reduce((sum, claim) => 
      sum + (claim.finalAmount || claim.estimatedAmount || 0), 0
    );

    setStats({
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalAmount
    });
  };

  const applyFilters = () => {
    let filtered = [...claims];

    if (filters.status !== 'all') {
      filtered = filtered.filter(claim => claim.status === filters.status);
    }

    if (filters.severity !== 'all') {
      filtered = filtered.filter(claim => claim.severity === filters.severity);
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(claim => 
        claim.claimNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        claim.incidentDescription.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (claim.userId?.name || '').toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredClaims(filtered);
  };

  const updateClaimStatus = async (claimId, status, reviewNotes = '', finalAmount = null) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reviewNotes, finalAmount }),
      });

      if (response.ok) {
        toast.success('Claim status updated successfully');
        fetchAdminData(); // Refresh data
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to update claim status');
      }
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast.error('Failed to update claim status');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage and review insurance claims</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalClaims}</h3>
            <p>Total Claims</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingClaims}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.approvedClaims}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.rejectedClaims}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="stat-card amount">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalAmount)}</h3>
            <p>Total Amount</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search claims..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="search-input"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under-review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
          className="filter-select"
        >
          <option value="all">All Severity</option>
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
      </div>

      {/* Claims Table */}
      <div className="claims-table-container">
        <div className="table-header">
          <h2>Claims Management</h2>
          <span className="results-count">
            {filteredClaims.length} result{filteredClaims.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No Claims Found</h3>
            <p>No claims match your current filters.</p>
          </div>
        ) : (
          <div className="claims-table">
            <table>
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Severity</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim._id}>
                    <td className="claim-number">
                      <Link to={`/claim/${claim._id}`}>
                        {claim.claimNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="customer-info">
                        <strong>{claim.userId?.name || 'Unknown'}</strong>
                        <small>{claim.userId?.email || ''}</small>
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-info">
                        {claim.vehicleInfo.year} {claim.vehicleInfo.make} {claim.vehicleInfo.model}
                      </div>
                    </td>
                    <td>
                      <span className={`severity-badge severity-${claim.severity}`}>
                        {claim.severity}
                      </span>
                    </td>
                    <td className="amount">
                      {formatCurrency(claim.finalAmount || claim.estimatedAmount || 0)}
                    </td>
                    <td>
                      <div className="status-cell">
                        {getStatusIcon(claim.status)}
                        <span className={`status-badge status-${claim.status}`}>
                          {claim.status.replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(claim.submittedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/claim/${claim._id}`}
                          className="action-btn view"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                        
                        {claim.status === 'pending' && (
                          <>
                            <button
                              className="action-btn approve"
                              title="Approve Claim"
                              onClick={() => updateClaimStatus(claim._id, 'approved')}
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              className="action-btn reject"
                              title="Reject Claim"
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) {
                                  updateClaimStatus(claim._id, 'rejected', reason);
                                }
                              }}
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <div className="action-card">
            <Users size={32} />
            <h3>User Management</h3>
            <p>Manage user accounts and permissions</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="action-card">
            <TrendingUp size={32} />
            <h3>Analytics</h3>
            <p>View detailed reports and analytics</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="action-card">
            <FileText size={32} />
            <h3>Export Data</h3>
            <p>Export claims data to CSV or PDF</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
