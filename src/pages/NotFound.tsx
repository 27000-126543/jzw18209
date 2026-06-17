import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">
          页面未找到
        </h2>
        <p className="text-gray-500 mb-8">
          抱歉，您访问的页面不存在或已被删除
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
