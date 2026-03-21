import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuthStore } from '../../store/authStore';

const Profile = () => {
    const { user, updateUser, logout } = useAuthStore();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!profileData.name.trim()) { toast.error('Name cannot be empty'); return; }
        setProfileLoading(true);
        try {
            const response = await api.put('/auth/profile', profileData);
            if (response.success) {
                updateUser(response.data.user);
                setProfileSaved(true);
                toast.success('Profile updated successfully!');
                setTimeout(() => setProfileSaved(false), 3000);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setPasswordLoading(true);
        try {
            const response = await api.put('/auth/profile/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            if (response.success) {
                toast.success('Password changed! Please log in again.');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => { logout(); navigate('/login'); }, 1500);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const roleColors = {
        admin: 'bg-red-500/20 text-red-300 border-red-500/30',
        driver: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        passenger: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
                    <p className="text-gray-300">Manage your account details and security</p>
                </div>

                {/* Account Info Card */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-400 text-sm">{user?.email}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${roleColors[user?.role] || roleColors.passenger}`}>
                                <Shield className="w-3 h-3" /> {user?.role}
                            </span>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleProfileSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                                    placeholder="Your full name"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-gray-600 text-xs mt-1">Email cannot be changed.</p>
                        </div>
                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {profileSaved ? (
                                <><CheckCircle className="w-5 h-5" /> Saved!</>
                            ) : profileLoading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-5 h-5" /> Save Changes</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Change Password</h2>
                            <p className="text-gray-400 text-sm">You'll be logged out after changing.</p>
                        </div>
                    </div>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                                    placeholder="Min. 6 characters"
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition ${
                                        passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                            ? 'border-red-500 focus:border-red-400'
                                            : 'border-white/10 focus:border-amber-500'
                                    }`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={passwordLoading || (passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {passwordLoading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Changing...</>
                            ) : (
                                <><Lock className="w-5 h-5" /> Change Password</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
