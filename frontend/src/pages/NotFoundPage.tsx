import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-6xl font-extrabold text-gray-900">
                    404
                </h2>
                <h3 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
                    Page not found
                </h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Sorry, we couldn't find the page you're looking for.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Go back
                        </button>
                        
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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