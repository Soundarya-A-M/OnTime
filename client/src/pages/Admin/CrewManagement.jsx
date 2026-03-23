import { useEffect, useState } from 'react';
import { UserPlus, Edit2, Trash2, X, Search, Users, Phone, Mail, Shield } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const CrewManagement = () => {
    const [crew, setCrew] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

    useEffect(() => { fetchCrew(); }, []);

    const fetchCrew = async () => {
        try {
            const res = await api.get('/auth/crew');
            if (res.success) setCrew(res.data.crew);
        } catch { toast.error('Failed to fetch crew'); }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setForm({ name: '', email: '', password: '', phone: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const res = await api.put(`/auth/crew/${editingId}`, { name: form.name, phone: form.phone });
                if (res.success) {
                    toast.success('Crew member updated');
                    fetchCrew();
                    resetForm();
                }
            } else {
                if (!form.password || form.password.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return;
                }
                const res = await api.post('/auth/crew', form);
                if (res.success) {
                    toast.success('Crew member created');
                    fetchCrew();
                    resetForm();
                }
            }
        } catch (err) {
            toast.error(err.message || 'Operation failed');
        }
    };

    const handleEdit = (member) => {
        setEditingId(member._id);
        setForm({ name: member.name, email: member.email, password: '', phone: member.phone || '' });
        setShowForm(true);
    };

    const handleToggleActive = async (member) => {
        try {
            if (member.isActive) {
                const res = await api.delete(`/auth/crew/${member._id}`);
                if (res.success) { toast.success('Crew member deactivated'); fetchCrew(); }
            } else {
                const res = await api.put(`/auth/crew/${member._id}`, { isActive: true });
                if (res.success) { toast.success('Crew member reactivated'); fetchCrew(); }
            }
        } catch (err) {
            toast.error(err.message || 'Failed to update status');
        }
    };

    const filtered = crew.filter(m =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.phone?.includes(search)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Crew Management</h1>
                        <p className="text-gray-300">Register and manage drivers & crew members</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add Crew Member
                    </button>
                </div>

                {/* Create / Edit Form */}
                {showForm && (
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'Edit Crew Member' : 'Register New Crew Member'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Full Name *</label>
                                <input
                                    type="text" required value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                    placeholder="Driver name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                                <input
                                    type="email" required value={form.email}
                                    disabled={!!editingId}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                    placeholder="driver@example.com"
                                />
                            </div>
                            {!editingId && (
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Password *</label>
                                    <input
                                        type="password" required={!editingId} value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        placeholder="Min. 6 characters"
                                        minLength={6}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Phone</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-4 py-3 bg-white/10 border border-white/10 border-r-0 rounded-l-lg text-gray-300 text-sm font-medium">+91</span>
                                    <input
                                        type="tel" value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        placeholder="98765 43210"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-xl transition">
                                    {editingId ? 'Update Crew Member' : 'Register Crew Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search + List */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Users className="w-6 h-6 text-purple-400" />
                            All Crew Members ({crew.length})
                        </h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text" placeholder="Search crew..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-3 text-gray-400 py-8 justify-center">
                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            Loading crew members...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">
                            {crew.length === 0 ? 'No crew members registered yet. Click "Add Crew Member" to get started.' : 'No results match your search.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Email</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Phone</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                                        <th className="text-right py-3 px-4 text-gray-300 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(member => (
                                        <tr key={member._id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {member.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span className="text-white font-medium">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-300 text-sm">{member.email}</td>
                                            <td className="py-3 px-4 text-gray-300 text-sm">{member.phone || '—'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                    {member.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(member)}
                                                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(member)}
                                                        className={`p-2 rounded-lg transition ${member.isActive ? 'text-red-400 hover:text-red-300 hover:bg-white/10' : 'text-green-400 hover:text-green-300 hover:bg-white/10'}`}
                                                        title={member.isActive ? 'Deactivate' : 'Reactivate'}
                                                    >
                                                        {member.isActive ? <Trash2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrewManagement;
