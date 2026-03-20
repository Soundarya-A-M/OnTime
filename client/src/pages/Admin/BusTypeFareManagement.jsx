import { useState, useEffect } from 'react';
import { DollarSign, Edit2, Check, X, Plus } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const BUS_TYPE_COLORS = {
    Ordinary: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
    Express: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
    AC: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' }
};

const BusTypeFareManagement = () => {
    const [fares, setFares] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFare, setNewFare] = useState({ busType: '', pricePerKM: '' });

    useEffect(() => {
        fetchFares();
    }, []);

    const fetchFares = async () => {
        try {
            const res = await api.get('/bus-types');
            if (res.success) {
                let fareList = res.data.fares;
                // Seed defaults if empty
                if (fareList.length === 0) {
                    await seedDefaults();
                    const res2 = await api.get('/bus-types');
                    fareList = res2.data.fares;
                }
                setFares(fareList);
            }
        } catch {
            toast.error('Failed to fetch bus type fares');
        }
    };

    const seedDefaults = async () => {
        const defaults = [
            { busType: 'Ordinary', pricePerKM: 1.2 },
            { busType: 'Express', pricePerKM: 1.5 },
            { busType: 'AC', pricePerKM: 2.5 }
        ];
        for (const d of defaults) {
            try { await api.post('/bus-types', d); } catch { /* already exists */ }
        }
    };

    const startEdit = (fare) => {
        setEditingId(fare._id);
        setEditPrice(fare.pricePerKM.toString());
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditPrice('');
    };

    const saveEdit = async (id) => {
        const price = parseFloat(editPrice);
        if (isNaN(price) || price <= 0) {
            toast.error('Enter a valid price');
            return;
        }
        setLoading(true);
        try {
            const res = await api.put(`/bus-types/${id}`, { pricePerKM: price });
            if (res.success) {
                toast.success('Price updated!');
                fetchFares();
                cancelEdit();
            }
        } catch {
            toast.error('Failed to update price');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = async () => {
        if (!newFare.busType || !newFare.pricePerKM) {
            toast.error('Fill in all fields');
            return;
        }
        const price = parseFloat(newFare.pricePerKM);
        if (isNaN(price) || price <= 0) {
            toast.error('Enter a valid price');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/bus-types', { busType: newFare.busType, pricePerKM: price });
            if (res.success) {
                toast.success('Bus type fare added!');
                fetchFares();
                setShowAddForm(false);
                setNewFare({ busType: '', pricePerKM: '' });
            }
        } catch (e) {
            toast.error(e.message || 'Failed to add bus type');
        } finally {
            setLoading(false);
        }
    };

    // Example fare calculation preview
    const exampleCalc = (pricePerKM) => {
        // Madikeri → Mangaluru = 130 km example
        return Math.round(130 * pricePerKM);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <DollarSign className="w-9 h-9 text-purple-400" /> Bus Type Fare Configuration
                    </h1>
                    <p className="text-gray-300">Configure price per kilometer for each bus type</p>
                </div>

                {/* Fare Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {fares.map(fare => {
                        const colors = BUS_TYPE_COLORS[fare.busType] || { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' };
                        const isEditing = editingId === fare._id;

                        return (
                            <div key={fare._id} className={`bg-white/10 backdrop-blur-lg border ${colors.border} rounded-2xl p-6 relative overflow-hidden`}>
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${colors.bg} -translate-y-8 translate-x-8 blur-xl`}></div>

                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border} mb-4`}>
                                    {fare.busType === 'Ordinary' ? '🚌' : fare.busType === 'Express' ? '🚀' : '❄️'} {fare.busType}
                                </div>

                                <div className="mb-2">
                                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Price per KM</p>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-xl font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={editPrice}
                                                onChange={e => setEditPrice(e.target.value)}
                                                step="0.1"
                                                min="0.1"
                                                className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-purple-500"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <p className={`text-3xl font-bold ${colors.text}`}>₹{fare.pricePerKM}<span className="text-sm font-normal text-gray-400">/km</span></p>
                                    )}
                                </div>

                                <div className="text-gray-400 text-xs mb-4">
                                    Example: Madikeri→Mangaluru (130 km)<br />
                                    <span className={`font-semibold ${colors.text}`}>
                                        ₹{isEditing ? Math.round(130 * (parseFloat(editPrice) || 0)) : exampleCalc(fare.pricePerKM)}
                                    </span>
                                </div>

                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => saveEdit(fare._id)} disabled={loading}
                                            className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 rounded-lg transition">
                                            <Check className="w-4 h-4" /> Save
                                        </button>
                                        <button onClick={cancelEdit}
                                            className="flex items-center justify-center gap-1 px-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => startEdit(fare)}
                                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition">
                                        <Edit2 className="w-4 h-4" /> Edit Price
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Fare Table */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">Fare Summary Table</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Bus Type</th>
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Price/km</th>
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">40 km fare</th>
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">130 km fare</th>
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">250 km fare</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fares.map(fare => (
                                    <tr key={fare._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <span className="text-white font-medium">
                                                {fare.busType === 'Ordinary' ? '🚌' : fare.busType === 'Express' ? '🚀' : '❄️'} {fare.busType}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-purple-300 font-mono">₹{fare.pricePerKM}</td>
                                        <td className="py-3 px-4 text-gray-300">₹{Math.round(40 * fare.pricePerKM)}</td>
                                        <td className="py-3 px-4 text-gray-300">₹{Math.round(130 * fare.pricePerKM)}</td>
                                        <td className="py-3 px-4 text-gray-300">₹{Math.round(250 * fare.pricePerKM)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add new bus type */}
                {!showAddForm ? (
                    <button onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-3 rounded-xl transition">
                        <Plus className="w-5 h-5" /> Add New Bus Type
                    </button>
                ) : (
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Add New Bus Type</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Bus Type Name</label>
                                <input
                                    type="text"
                                    value={newFare.busType}
                                    onChange={e => setNewFare(f => ({ ...f, busType: e.target.value }))}
                                    placeholder="e.g. Sleeper"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Price per KM (₹)</label>
                                <input
                                    type="number"
                                    value={newFare.pricePerKM}
                                    onChange={e => setNewFare(f => ({ ...f, pricePerKM: e.target.value }))}
                                    placeholder="e.g. 3.0"
                                    step="0.1"
                                    min="0.1"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAddNew} disabled={loading}
                                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                                {loading ? 'Adding...' : 'Add Bus Type'}
                            </button>
                            <button onClick={() => { setShowAddForm(false); setNewFare({ busType: '', pricePerKM: '' }); }}
                                className="px-6 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusTypeFareManagement;
