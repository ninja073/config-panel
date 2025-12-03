import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { Calendar, IndianRupee, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to authenticate.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Left Side - Blue Background */}
            <div className="hidden lg:flex w-1/2 bg-[#1e66d5] flex-col justify-center px-12 relative text-white">
                <div className="mb-8">
                    <div className="w-24 h-24 border-2 border-white rounded-lg flex items-center justify-center mb-6 relative">
                        <Calendar className="w-12 h-12" />
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
                            <div className="bg-[#1e66d5] rounded-full p-1">
                                <IndianRupee className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        {/* Decorative squares to mimic the icon in image */}
                        <div className="absolute top-2 left-2 w-2 h-2 border border-white"></div>
                        <div className="absolute top-2 right-2 w-2 h-2 border border-white"></div>
                        <div className="absolute bottom-2 left-2 w-2 h-2 border border-white"></div>
                    </div>

                    <h1 className="text-5xl font-bold mb-4 leading-tight">
                        Comes with<br />
                        Built-in Firebase Authentication
                    </h1>
                    <p className="text-lg text-blue-100 max-w-md leading-relaxed">
                        Seamlessly manage question bank for the QUIZ GURU app.
                    </p>
                </div>

                {/* Pagination Dots */}
                <div className="flex space-x-2 mt-8">
                    <div className="w-8 h-2 bg-white rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
                        <p className="text-gray-500">Manage all your QUIZ app from one place</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isSignUp ? 'Create Password' : 'Password'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder={isSignUp ? "Create a password" : "Enter your password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1e66d5] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            {isSignUp ? 'Have an account? ' : 'Don\'t have an account? '}
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="font-semibold text-[#1e66d5] hover:text-blue-700"
                            >
                                {isSignUp ? 'Sign in' : 'Sign Up'}
                            </button>
                        </p>
                    </div>

                    <div className="mt-12 text-center text-sm text-gray-500">
                        Need Help? <button className="font-semibold text-[#1e66d5] hover:text-blue-700">Contact Us</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
