import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <h2 className="text-6xl font-extrabold text-gray-900 mb-6">404</h2>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h3>
                    <p className="text-gray-600 mb-8">Sorry, we couldn't find the page you're looking for.</p>

                    <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Go back
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Home size={16} className="mr-2" />
                            Go home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;