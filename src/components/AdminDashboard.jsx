import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAllExamResults } from '../services/examServices';

export default function AdminDashboard({ currentUser, userProfile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [usersList, setUsersList] = useState([]);
  const [examResultsList, setExamResultsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all registered users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsersList(users);

      // Fetch global exam results across all candidates
      const results = await getAllExamResults();
      setExamResultsList(results);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Error updating user role.');
    }
  };

  const getCandidateName = (userId) => {
    const found = usersList.find(u => u.id === userId);
    return found?.fullName || found?.username || found?.email || userId || 'Unknown Candidate';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">
            <span>🛡️ System Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Admin Management Portal</h1>
          <p className="text-slate-300 text-sm mt-1">
            Welcome back, {userProfile?.fullName || currentUser?.email || 'Administrator'}. Monitor platform activity and candidate records.
          </p>
        </div>
        
        {/* Dynamic Sync Data Button */}
        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-50 transition-all backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>🔄</span>
          <span>{loading ? 'Syncing Database...' : 'Sync Data'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registered Candidates</span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{usersList.length}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Mock Tests Submitted</span>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{examResultsList.length}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Database Status</span>
          <h3 className="text-sm font-bold text-emerald-600 mt-3 bg-emerald-50 py-1 px-2.5 rounded-lg inline-block">Connected Live ✓</h3>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview & System Status
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Candidate Management ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Candidate Exam History ({examResultsList.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-base">Quick System Control</h3>
            <p className="text-slate-500 text-xs">Manage all registered accounts, test sessions, and platform parameters.</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono">
              Admin Account: {currentUser?.email || 'bsamgreat1@gmail.com'}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-base">Platform Engine</h3>
            <p className="text-slate-500 text-xs">JAMB UTME CBT Engine running with AI Fallback Generation enabled.</p>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-base">Registered Candidates Database</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-semibold">Loading users...</td></tr>
                ) : usersList.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8 text-slate-400 font-semibold">No registered users found.</td></tr>
                ) : (
                  usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">{user.fullName || user.username || 'N/A'}</td>
                      <td className="p-4 text-slate-600">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.role || 'student'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleUserRole(user.id, user.role)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl transition"
                        >
                          Toggle Role
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base">Global Candidate Exam History & Scores</h3>
            <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-xl text-xs font-bold">{examResultsList.length} Total Submissions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-4">Candidate Name</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-semibold">Loading histories...</td></tr>
                ) : examResultsList.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-semibold">No exam attempts recorded in database yet.</td></tr>
                ) : (
                  examResultsList.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">{getCandidateName(record.userId)}</td>
                      <td className="p-4 font-semibold text-blue-600 uppercase">{record.subject || 'CBT Exam'}</td>
                      <td className="p-4 font-black text-emerald-600">{record.score} / {record.totalQuestions || 40}</td>
                      <td className="p-4 uppercase font-bold text-[10px]">
                        <span className="bg-blue-50 text-blue-700 py-1 px-2.5 rounded-full">{record.mode || 'Practice'}</span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(record.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}