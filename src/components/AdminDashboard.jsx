import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAllExamResults, adminConfirmAndGeneratePin } from '../services/examServices';

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
      const usersSnapshot = await getDocs(collection(db, 'students'));
      console.log("Raw Firestore snapshot size:", usersSnapshot.size);
      const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsersList(users);

      const results = await getAllExamResults();
      setExamResultsList(results);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

 const handleToggleUserRole = async (userId, currentRole) => {
    if (currentRole === 'admin') {
      alert('Security Restriction: Admin accounts cannot be changed to students.');
      return;
    }

    const newRole = 'admin';
    try {
      // Pointing to your actual 'students' collection in Firestore
      await updateDoc(doc(db, 'students', userId), { role: newRole });
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Error updating user role.');
    }
  };

  // Handler for admin manual payment check & pin generation
  const handleConfirmAndGenerate = async (userId, candidateName) => {
    const confirmPayment = window.confirm(`Have you manually verified the payment for ${candidateName || 'this candidate'}? Click OK to confirm payment and issue an activation pin.`);
    
    if (!confirmPayment) return;

    try {
      const pin = await adminConfirmAndGeneratePin(userId);
      setUsersList(usersList.map(u => u.id === userId ? { 
        ...u, 
        assignedExamPin: pin, 
        examPinStatus: 'unused', 
        paymentStatus: 'confirmed_by_admin' 
      } : u));
      
      alert(`Payment confirmed & Pin generated for ${candidateName || 'Candidate'}:\n\n${pin}\n\nCopy and send this pin to the candidate.`);
    } catch (error) {
      console.error('Error confirming payment & generating pin:', error);
      alert('Failed to process confirmation and generate pin.');
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
            Welcome back, {userProfile?.fullName || currentUser?.email || 'Administrator'}. Monitor platform activity and candidate activation pins.
          </p>
        </div>
        
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
            <p className="text-slate-500 text-xs">Verify candidate payments manually, issue activation pins, and grant Exam Mode permissions.</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono">
              Admin Account: {currentUser?.email || 'Administrator'}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-base">Platform Engine</h3>
            <p className="text-slate-500 text-xs">JAMB UTME CBT Engine active with secure PIN confirmation safeguards.</p>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base">Candidate Payment Verification & PIN Control</h3>
            <span className="text-xs text-slate-500">Confirm payment manually before issuing pins</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-4">Name / Email</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Assigned Pin</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-semibold">Loading candidates...</td></tr>
                ) : usersList.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-semibold">No registered candidates found.</td></tr>
                ) : (
                  usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{user.fullName || user.username || 'N/A'}</div>
                        <div className="text-slate-400 text-[11px]">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                          user.paymentStatus === 'confirmed_by_admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {user.paymentStatus === 'confirmed_by_admin' ? 'Confirmed ✓' : 'Pending Verification ⏳'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {user.assignedExamPin ? (
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                            {user.assignedExamPin}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">No pin assigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role || 'student'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleConfirmAndGenerate(user.id, user.fullName)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl shadow-sm transition"
                        >
                          {user.assignedExamPin ? 'Regenerate Pin' : 'Confirm & Issue Pin'}
                        </button>
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