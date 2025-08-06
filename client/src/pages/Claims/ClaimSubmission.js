import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { 
  Upload, 
  X, 
  Camera, 
  FileText, 
  Car, 
  MapPin, 
  Calendar,
  Send,
  AlertCircle
} from 'lucide-react';
import './ClaimSubmission.css';

const ClaimSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onDrop = useCallback((acceptedFiles) => {
    // Limit to 5 files
    if (uploadedFiles.length + acceptedFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [uploadedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const onSubmit = async (data) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
      toast.error('Please log in to submit a claim');
      navigate('/login');
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one image of the damage');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('userId', user.id);
      formData.append('vehicleInfo', JSON.stringify({
        make: data.vehicleMake,
        model: data.vehicleModel,
        year: data.vehicleYear,
        vin: data.vehicleVin,
        licensePlate: data.licensePlate
      }));
      formData.append('incidentDescription', data.incidentDescription);
      formData.append('incidentDate', data.incidentDate);
      formData.append('location', data.location);

      // Add images
      uploadedFiles.forEach((fileData) => {
        formData.append('images', fileData.file);
      });

      const response = await fetch('/api/claims/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Claim submitted successfully!');
        
        // Clean up file previews
        uploadedFiles.forEach(fileData => {
          if (fileData.preview) {
            URL.revokeObjectURL(fileData.preview);
          }
        });
        
        navigate(`/claim/${result.claim._id}`);
      } else {
        toast.error(result.error || 'Failed to submit claim');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-submission">
      <div className="submission-header">
        <h1>Submit Insurance Claim</h1>
        <p>Upload photos and provide details about your vehicle damage</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="submission-form">
        {/* Image Upload Section */}
        <div className="form-section">
          <h2>
            <Camera size={20} />
            Upload Damage Photos
          </h2>
          <p className="section-description">
            Upload clear photos of the vehicle damage. Our AI will analyze the images automatically.
          </p>

          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-content">
              <Upload size={48} />
              <h3>
                {isDragActive 
                  ? 'Drop the images here...' 
                  : 'Drag & drop images here, or click to select'
                }
              </h3>
              <p>Support: JPG, PNG, GIF, WebP (Max 10MB each, up to 5 images)</p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              <h4>Uploaded Images ({uploadedFiles.length}/5)</h4>
              <div className="files-grid">
                {uploadedFiles.map((fileData) => (
                  <div key={fileData.id} className="file-preview">
                    <img 
                      src={fileData.preview} 
                      alt="Damage preview"
                      className="preview-image"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(fileData.id)}
                      className="remove-file"
                    >
                      <X size={16} />
                    </button>
                    <div className="file-info">
                      <span className="file-name">{fileData.file.name}</span>
                      <span className="file-size">
                        {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Information */}
        <div className="form-section">
          <h2>
            <Car size={20} />
            Vehicle Information
          </h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vehicle Make *</label>
              <input
                type="text"
                className={`form-control ${errors.vehicleMake ? 'error' : ''}`}
                placeholder="e.g., Toyota, Honda, Ford"
                {...register('vehicleMake', { required: 'Vehicle make is required' })}
              />
              {errors.vehicleMake && (
                <span className="error-message">{errors.vehicleMake.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Model *</label>
              <input
                type="text"
                className={`form-control ${errors.vehicleModel ? 'error' : ''}`}
                placeholder="e.g., Camry, Civic, F-150"
                {...register('vehicleModel', { required: 'Vehicle model is required' })}
              />
              {errors.vehicleModel && (
                <span className="error-message">{errors.vehicleModel.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Year *</label>
              <input
                type="number"
                className={`form-control ${errors.vehicleYear ? 'error' : ''}`}
                placeholder="e.g., 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                {...register('vehicleYear', { 
                  required: 'Vehicle year is required',
                  min: { value: 1900, message: 'Invalid year' },
                  max: { value: new Date().getFullYear() + 1, message: 'Invalid year' }
                })}
              />
              {errors.vehicleYear && (
                <span className="error-message">{errors.vehicleYear.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">License Plate</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., ABC-1234"
                {...register('licensePlate')}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">VIN (Vehicle Identification Number)</label>
              <input
                type="text"
                className="form-control"
                placeholder="17-digit VIN"
                maxLength="17"
                {...register('vehicleVin')}
              />
            </div>
          </div>
        </div>

        {/* Incident Details */}
        <div className="form-section">
          <h2>
            <FileText size={20} />
            Incident Details
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                Incident Date *
              </label>
              <input
                type="date"
                className={`form-control ${errors.incidentDate ? 'error' : ''}`}
                max={new Date().toISOString().split('T')[0]}
                {...register('incidentDate', { required: 'Incident date is required' })}
              />
              {errors.incidentDate && (
                <span className="error-message">{errors.incidentDate.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Location
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="City, State or Address"
                {...register('location')}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Incident Description *</label>
              <textarea
                className={`form-control ${errors.incidentDescription ? 'error' : ''}`}
                rows="5"
                placeholder="Describe what happened, how the damage occurred, and any other relevant details..."
                {...register('incidentDescription', { 
                  required: 'Incident description is required',
                  minLength: { value: 20, message: 'Please provide at least 20 characters' }
                })}
              />
              {errors.incidentDescription && (
                <span className="error-message">{errors.incidentDescription.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* AI Analysis Info */}
        <div className="ai-info">
          <AlertCircle size={20} />
          <div>
            <h4>AI-Powered Analysis</h4>
            <p>
              Once you submit your claim, our AI will automatically analyze your photos 
              to assess damage severity and estimate repair costs. You'll receive instant 
              feedback and can track your claim's progress in real-time.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-large submit-btn"
            disabled={loading || uploadedFiles.length === 0}
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <Send size={18} />
                Submit Claim
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClaimSubmission;
