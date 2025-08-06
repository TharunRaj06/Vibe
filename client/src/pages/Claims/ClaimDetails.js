import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  MapPin, 
  Car, 
  Camera, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Download
} from 'lucide-react';
import { toast } from 'react-toastify';

const ClaimDetails = () => {
  const { claimId } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaimDetails();
  }, [claimId]);

  const fetchClaimDetails = async () => {
    try {
      const response = await fetch(`/api/claims/${claimId}`);
      if (response.ok) {
        const claimData = await response.json();
        setClaim(claimData);
      } else {
        toast.error('Failed to load claim details');
      }
    } catch (error) {
      console.error('Error fetching claim:', error);
      toast.error('Failed to load claim details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} className="status-icon pending" />;
      case 'under-review':
        return <FileText size={20} className="status-icon review" />;
      case 'approved':
        return <CheckCircle size={20} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={20} className="status-icon rejected" />;
      default:
        return <Clock size={20} className="status-icon" />;
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
      month: 'long',
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

  if (!claim) {
    return (
      <div className="claim-error">
        <h2>Claim Not Found</h2>
        <p>The requested claim could not be found.</p>
        <Link to="/claims" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Claims
        </Link>
      </div>
    );
  }

  return (
    <div className="claim-details">
      <div className="claim-header">
        <Link to="/claims" className="back-link">
          <ArrowLeft size={16} />
          Back to Claims
        </Link>
        
        <div className="claim-title">
          <h1>Claim #{claim.claimNumber}</h1>
          <div className="claim-status">
            {getStatusIcon(claim.status)}
            <span className={`status-badge status-${claim.status}`}>
              {claim.status.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="claim-content">
        {/* Claim Overview */}
        <div className="card claim-overview">
          <h2>Claim Overview</h2>
          <div className="overview-grid">
            <div className="overview-item">
              <Calendar size={18} />
              <div>
                <label>Submitted Date</label>
                <span>{formatDate(claim.submittedAt)}</span>
              </div>
            </div>
            
            <div className="overview-item">
              <Calendar size={18} />
              <div>
                <label>Incident Date</label>
                <span>{formatDate(claim.incidentDate)}</span>
              </div>
            </div>
            
            <div className="overview-item">
              <MapPin size={18} />
              <div>
                <label>Location</label>
                <span>{claim.location || 'Not specified'}</span>
              </div>
            </div>
            
            <div className="overview-item">
              <DollarSign size={18} />
              <div>
                <label>Estimated Amount</label>
                <span>{formatCurrency(claim.estimatedAmount || 0)}</span>
              </div>
            </div>
            
            {claim.finalAmount && (
              <div className="overview-item">
                <DollarSign size={18} />
                <div>
                  <label>Final Amount</label>
                  <span className="final-amount">{formatCurrency(claim.finalAmount)}</span>
                </div>
              </div>
            )}
            
            <div className="overview-item">
              <FileText size={18} />
              <div>
                <label>Damage Severity</label>
                <span className={`severity-badge severity-${claim.severity}`}>
                  {claim.severity} damage
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="card vehicle-info">
          <h2>
            <Car size={20} />
            Vehicle Information
          </h2>
          <div className="vehicle-details">
            <div className="vehicle-item">
              <label>Make & Model</label>
              <span>{claim.vehicleInfo.make} {claim.vehicleInfo.model}</span>
            </div>
            <div className="vehicle-item">
              <label>Year</label>
              <span>{claim.vehicleInfo.year}</span>
            </div>
            {claim.vehicleInfo.licensePlate && (
              <div className="vehicle-item">
                <label>License Plate</label>
                <span>{claim.vehicleInfo.licensePlate}</span>
              </div>
            )}
            {claim.vehicleInfo.vin && (
              <div className="vehicle-item">
                <label>VIN</label>
                <span>{claim.vehicleInfo.vin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Incident Description */}
        <div className="card incident-description">
          <h2>
            <FileText size={20} />
            Incident Description
          </h2>
          <p>{claim.incidentDescription}</p>
        </div>

        {/* Damage Photos */}
        {claim.imageUrls && claim.imageUrls.length > 0 && (
          <div className="card damage-photos">
            <h2>
              <Camera size={20} />
              Damage Photos ({claim.imageUrls.length})
            </h2>
            <div className="photos-grid">
              {claim.imageUrls.map((imageUrl, index) => (
                <div key={index} className="photo-item">
                  <img 
                    src={imageUrl} 
                    alt={`Damage photo ${index + 1}`}
                    className="damage-photo"
                  />
                  <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="photo-download"
                  >
                    <Download size={16} />
                    View Full Size
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {claim.damageAnalysis && claim.damageAnalysis.length > 0 && (
          <div className="card ai-analysis">
            <h2>AI Analysis Results</h2>
            <div className="analysis-results">
              {claim.damageAnalysis.map((analysis, index) => (
                <div key={index} className="analysis-item">
                  <h4>Photo {index + 1} Analysis</h4>
                  <div className="analysis-details">
                    <div className="analysis-row">
                      <label>Detected Severity:</label>
                      <span className={`severity-badge severity-${analysis.severity}`}>
                        {analysis.severity}
                      </span>
                    </div>
                    {analysis.confidence && (
                      <div className="analysis-row">
                        <label>Confidence:</label>
                        <span>{(analysis.confidence * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {analysis.damageTypes && analysis.damageTypes.length > 0 && (
                      <div className="analysis-row">
                        <label>Damage Types:</label>
                        <span>{analysis.damageTypes.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Notes */}
        {claim.reviewNotes && (
          <div className="card review-notes">
            <h2>Review Notes</h2>
            <p>{claim.reviewNotes}</p>
            {claim.reviewedAt && (
              <small className="review-date">
                Reviewed on {formatDate(claim.reviewedAt)}
              </small>
            )}
          </div>
        )}

        {/* Claim Timeline */}
        <div className="card claim-timeline">
          <h2>Claim Timeline</h2>
          <div className="timeline">
            <div className="timeline-item active">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4>Claim Submitted</h4>
                <p>{formatDate(claim.submittedAt)}</p>
              </div>
            </div>
            
            {claim.status !== 'pending' && (
              <div className="timeline-item active">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>Under Review</h4>
                  <p>Claim is being processed</p>
                </div>
              </div>
            )}
            
            {(claim.status === 'approved' || claim.status === 'rejected') && (
              <div className="timeline-item active">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>
                    {claim.status === 'approved' ? 'Claim Approved' : 'Claim Rejected'}
                  </h4>
                  {claim.reviewedAt && <p>{formatDate(claim.reviewedAt)}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetails;
