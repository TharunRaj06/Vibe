import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';

const ClaimHistory = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      fetchClaims(user.id);
    } else {
      toast.error('Please log in to view claims');
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [claims, filters]);

  const fetchClaims = async (userId) => {
    try {
      const response = await fetch(
        `/api/claims/user/${userId}?page=${currentPage}&limit=10&status=${filters.status}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims);
        setTotalPages(data.totalPages);
      } else {
        toast.error('Failed to load claims');
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...claims];

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(claim => 
        claim.claimNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        claim.incidentDescription.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        `${claim.vehicleInfo.make} ${claim.vehicleInfo.model}`.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(claim => 
        new Date(claim.submittedAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(claim => 
        new Date(claim.submittedAt) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    setFilteredClaims(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
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

  const getStatusCounts = () => {
    const counts = {
      all: claims.length,
      pending: 0,
      'under-review': 0,
      approved: 0,
      rejected: 0
    };

    claims.forEach(claim => {
      counts[claim.status] = (counts[claim.status] || 0) + 1;
    });

    return counts;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="claim-history">
      <div className="history-header">
        <div className="header-content">
          <h1>My Claims</h1>
          <p>Track and manage your insurance claims</p>
        </div>
        <Link to="/submit-claim" className="btn btn-primary">
          <Plus size={18} />
          Submit New Claim
        </Link>
      </div>

      {/* Status Filters */}
      <div className="status-filters">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            className={`filter-btn ${filters.status === status ? 'active' : ''}`}
            onClick={() => handleFilterChange('status', status)}
          >
            <span className="filter-label">
              {status === 'all' ? 'All Claims' : 
               status.split('-').map(word => 
                 word.charAt(0).toUpperCase() + word.slice(1)
               ).join(' ')
              }
            </span>
            <span className="filter-count">{count}</span>
          </button>
        ))}
      </div>

      {/* Search and Additional Filters */}
      <div className="search-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search claims by number, description, or vehicle..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="date-filters">
          <div className="date-filter">
            <label>From:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-filter">
            <label>To:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>
            {claims.length === 0 ? 'No Claims Found' : 'No Matching Claims'}
          </h3>
          <p>
            {claims.length === 0 
              ? "You haven't submitted any claims yet. Start by submitting your first claim."
              : "Try adjusting your search criteria or filters."
            }
          </p>
          {claims.length === 0 && (
            <Link to="/submit-claim" className="btn btn-primary">
              Submit First Claim
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="claims-grid">
            {filteredClaims.map((claim) => (
              <Link
                key={claim._id}
                to={`/claim/${claim._id}`}
                className="claim-card"
              >
                <div className="claim-card-header">
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

                <div className="claim-vehicle">
                  <h3>{claim.vehicleInfo.year} {claim.vehicleInfo.make} {claim.vehicleInfo.model}</h3>
                  <span className={`severity-badge severity-${claim.severity}`}>
                    {claim.severity} damage
                  </span>
                </div>

                <div className="claim-description">
                  <p>
                    {claim.incidentDescription.length > 100
                      ? `${claim.incidentDescription.substring(0, 100)}...`
                      : claim.incidentDescription
                    }
                  </p>
                </div>

                <div className="claim-details">
                  <div className="detail-item">
                    <Calendar size={14} />
                    <span>Submitted: {formatDate(claim.submittedAt)}</span>
                  </div>
                  <div className="detail-item">
                    <DollarSign size={14} />
                    <span className="amount">
                      {formatCurrency(claim.finalAmount || claim.estimatedAmount || 0)}
                    </span>
                  </div>
                </div>

                {claim.imageUrls && claim.imageUrls.length > 0 && (
                  <div className="claim-images">
                    <span className="image-count">
                      {claim.imageUrls.length} photo{claim.imageUrls.length !== 1 ? 's' : ''}
                    </span>
                    <div className="image-previews">
                      {claim.imageUrls.slice(0, 3).map((imageUrl, index) => (
                        <div key={index} className="image-preview">
                          <img src={imageUrl} alt={`Damage ${index + 1}`} />
                        </div>
                      ))}
                      {claim.imageUrls.length > 3 && (
                        <div className="more-images">
                          +{claim.imageUrls.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="pagination-info">
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClaimHistory;
