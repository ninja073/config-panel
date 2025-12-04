import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { LayoutDashboard, BookOpen, FileQuestion, LogOut, Menu, X, FileText, HelpCircle, Bell } from 'lucide-react';
import clsx from 'clsx';

const Layout: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/exams', label: 'Exams', icon: BookOpen },
        { path: '/questions', label: 'Questions', icon: FileQuestion },
        { path: '/pdf-extractor', label: 'PDF Extractor', icon: FileText },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col transition-transform duration-200 ease-in-out",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-indigo-600">Config Panel</h1>
                    <button
                        className="ml-auto lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navigation Bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center lg:hidden">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700 mr-4"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Right Side Icons */}
                    <div className="ml-auto flex items-center space-x-6">
                        <button className="text-gray-400 hover:text-gray-600">
                            <HelpCircle className="h-6 w-6" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                        </button>

                        <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0]}</p>
                                <p className="text-xs text-gray-500">Admin</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                                {user?.email?.[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
