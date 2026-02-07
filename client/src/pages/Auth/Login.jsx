import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuthStore } from '../../store/authStore';

const Login=() => {
    const [formData, setFormData]=useState({ email: '', password: '' });
    const [loading, setLoading]=useState(false);
    const { setAuth }=useAuthStore();
    const navigate=useNavigate();

    const handleSubmit=async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response=await api.post('/auth/login', formData);

            if (response.success) {
                setAuth(response.data.user, response.data.token);
                toast.success('Login successful!');

                // Redirect based on role
                const dashboardMap={
                    passenger: '/dashboard',
                    driver: '/driver/dashboard',
                    admin: '/admin/dashboard'
                };
                navigate(dashboardMap[response.data.user.role] || '/');
            }
        } catch (error) {
            toast.error(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
<div className="max-w-md w-full">
{/* Header */ }
<div className="text-center mb-8">
<h1 className="text-4xl font-bold text-white mb-2">Welcome Back< / h1>
<p className="text-gray-300">Sign in to continue to OnTime< / p>
< / div>

{/* Login Form */ }
<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
<form onSubmit={ handleSubmit } className="space-y-6">
{/* Email */ }
<div>
<label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
< / label>
<div className="relative">
<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
<input
type="email"
required
value={ formData.email }
onChange={(e) => setFormData({ ...formData, email: e.target.value })}
className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
placeholder="you@example.com"
    />
< / div>
< / div>

{/* Password */ }
<div>
<label className="block text-sm font-medium text-gray-200 mb-2">
Password
< / label>
<div className="relative">
<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
<input
type="password"
required
value={ formData.password }
onChange={(e) => setFormData({ ...formData, password: e.target.value })}
className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
placeholder="••••••••"
    />
< / div>
< / div>

{/* Submit Button */ }
<button
type="submit"
disabled={ loading }
className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
{
    loading ? (
    <>
    <Loader className="w-5 h-5 animate-spin" />
    <span>Logging in...< / span>
    < />
              ) : (
    <>
    <LogIn className="w-5 h-5" />
    <span>Sign In< / span>
    < />
              )
}
< / button>
< / form>

{/* Register Link */ }
<div className="mt-6 text-center">
<p className="text-gray-300">
              Don't have an account?{' '}
<Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign up
< / Link>
< / p>
< / div>
< / div>
< / div>
< / div>
  );
};

export default Login;
