import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* Animated bus icon */}
                <div className="relative mb-8 flex justify-center">
                    <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                        <MapPin className="w-16 h-16 text-purple-400 opacity-50" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/40">
                        <span className="text-2xl font-black text-purple-300">?</span>
                    </div>
                </div>

                <h1 className="text-8xl font-black text-white mb-4 leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">404</span>
                </h1>

                <h2 className="text-2xl font-bold text-white mb-3">This bus doesn't stop here</h2>
                <p className="text-gray-400 mb-10 leading-relaxed">
                    The page you're looking for has either been moved, deleted, or never existed.
                    Let's get you back on the right route.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition font-medium"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
