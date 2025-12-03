import React, { useEffect, useState } from 'react';
import { getExams, getQuestions } from '../services/db';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    exams: 0,
    questions: 0,
    users: 0 // We don't have a way to count users easily without admin SDK, so we'll keep this 0 or mock it
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [examsData, questionsData] = await Promise.all([getExams(), getQuestions()]);
        setStats({
          exams: examsData.length,
          questions: questionsData.length,
          users: 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Total Exams</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.exams}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Total Questions</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.questions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
          <p className="text-3xl font-bold text-gray-400 mt-2">N/A</p>
          <p className="text-xs text-gray-500 mt-1">User tracking requires Admin SDK</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
