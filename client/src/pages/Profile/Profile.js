import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Edit,
  FileText,
  Calendar
} from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      reset(parsedUser);
      fetchUserStats(parsedUser.id);
    }
  }, [reset]);

  const fetchUserStats = async (userId) => {
    try {
      const response = await fetch(`/api/claims/user/${userId}?limit=100`);
      if (response.ok) {
        const data = await response.json();
        const claims = data.claims;
        
        setStats({
          totalClaims: claims.length,
          pendingClaims: claims.filter(c => c.status === 'pending').length,
          approvedClaims: claims.filter(c => c.status === 'approved').length
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const onSubmit = async (data) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        const updatedUser = result.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    if (user) {
      reset(user);
      setEditing(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-error">
        <h2>Profile Not Found</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
        {/* User Stats */}
        <div className="card stats-section">
          <h2>Account Overview</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <FileText size={24} />
              <div>
                <h3>{stats.totalClaims}</h3>
                <p>Total Claims</p>
              </div>
            </div>
            <div className="stat-item">
              <Calendar size={24} />
              <div>
                <h3>{stats.pendingClaims}</h3>
                <p>Pending Claims</p>
              </div>
            </div>
            <div className="stat-item">
              <FileText size={24} />
              <div>
                <h3>{stats.approvedClaims}</h3>
                <p>Approved Claims</p>
              </div>
            </div>
            <div className="stat-item">
              <Calendar size={24} />
              <div>
                <h3>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</h3>
                <p>Member Since</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="card profile-form">
          <div className="form-header">
            <h2>Personal Information</h2>
            {!editing ? (
              <button 
                className="btn btn-secondary"
                onClick={() => setEditing(true)}
              >
                <Edit size={16} />
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner small"></div>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="profile-fields">
            <div className="field-group">
              <label className="field-label">
                <User size={18} />
                Full Name
              </label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'error' : ''} ${!editing ? 'readonly' : ''}`}
                readOnly={!editing}
                {...register('name', {
                  required: editing ? 'Name is required' : false,
                  minLength: editing ? {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  } : undefined
                })}
              />
              {errors.name && editing && (
                <span className="error-message">{errors.name.message}</span>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                className="form-control readonly"
                readOnly
                value={user.email}
              />
              <small className="field-note">
                Email cannot be changed. Contact support if you need to update your email.
              </small>
            </div>

            <div className="field-group">
              <label className="field-label">
                <Phone size={18} />
                Phone Number
              </label>
              <input
                type="tel"
                className={`form-control ${!editing ? 'readonly' : ''}`}
                placeholder="Enter your phone number"
                readOnly={!editing}
                {...register('phone')}
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                <MapPin size={18} />
                Address
              </label>
              <textarea
                className={`form-control ${!editing ? 'readonly' : ''}`}
                rows="3"
                placeholder="Enter your address"
                readOnly={!editing}
                {...register('address')}
              />
            </div>

            {editing && (
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Settings */}
        <div className="card account-settings">
          <h2>Account Settings</h2>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Email Notifications</h4>
                <p>Receive updates about your claims via email</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>SMS Notifications</h4>
                <p>Get text messages for important claim updates</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Marketing Communications</h4>
                <p>Receive promotional emails and product updates</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card danger-zone">
          <h2>Danger Zone</h2>
          <div className="danger-actions">
            <div className="danger-item">
              <div>
                <h4>Delete Account</h4>
                <p>Permanently delete your account and all associated data</p>
              </div>
              <button className="btn btn-danger">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
