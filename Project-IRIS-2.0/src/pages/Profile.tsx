import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { profileAPI } from '../services/apiService';
import { EyeIcon, UserGroupIcon } from '../../components/Icons';

export const Profile: React.FC = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage || '');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('address', address);
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await profileAPI.updateProfile(formData);
      updateUser(response.data.user);
      setMessage('Profile updated successfully!');
      setEditing(false);
    } catch (error: any) {
      setMessage(error.response?.data?.msg || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      Free: 'bg-gray-600',
      Basic: 'bg-blue-600',
      Premium: 'bg-purple-600',
      'Device Owner': 'bg-gradient-to-r from-yellow-500 to-orange-500',
    };
    return colors[plan] || 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <EyeIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              IRIS 2.0
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700 mb-6">
          <div className="flex items-center gap-6 mb-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <UserGroupIcon className="w-12 h-12 text-white" />
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-cyan-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="text-white text-xs">📷</span>
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.name || 'User'}</h1>
              <p className="text-gray-400 mb-3">{user.email}</p>
              <div className="flex items-center gap-2">
                <span className={`${getPlanBadge(user.subscription.plan)} text-white text-sm px-3 py-1 rounded-full font-semibold`}>
                  {user.subscription.plan} Plan
                </span>
                <span className={`${user.subscription.status === 'active' ? 'bg-green-600' : 'bg-gray-600'} text-white text-sm px-3 py-1 rounded-full`}>
                  {user.subscription.status}
                </span>
              </div>
            </div>

            {/* Edit Toggle */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        {editing ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('success') 
                  ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                  : 'bg-red-500/10 border border-red-500/50 text-red-400'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="123 Main St, City, State, ZIP"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Info Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Address</p>
                  <p className="text-white">{user.address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Subscription</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Current Plan</p>
                  <p className="text-white font-semibold">{user.subscription.plan}</p>
                </div>
                {user.subscription.endDate && (
                  <div>
                    <p className="text-gray-400 text-sm">Expires On</p>
                    <p className="text-white">
                      {new Date(user.subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <Link
                  to="/premium"
                  className="block text-center py-2 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition"
                >
                  Upgrade Plan
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
