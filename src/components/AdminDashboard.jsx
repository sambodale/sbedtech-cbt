import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AdminDashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    async function fetchAllResultsWithProfiles() {
      try {
        const querySnapshot = await getDocs(collection(db, 'exam_results'));
        const allResults = [];
        
        // Loop through each exam result and fetch its associated user profile
        for (const examDoc of querySnapshot.docs) {
          const data = examDoc.data();
          let candidateName = 'Unknown User';

          if (data.userId) {
            try {
              // Fetch user profile from your 'users' or 'profiles' collection (adjust name if yours differs)
              const userRef = doc(db, 'users', data.userId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                // Prioritize username, then fullName, then email prefix
                candidateName = userData.username || userData.fullName || userData.email?.split('@')[0] || data.userId;
              } else {
                candidateName = data.userId.substring(0, 8) + '...'; // Fallback shortened ID if no user doc exists
              }
            } catch (err) {
              console.error('Error fetching user profile for ID:', data.userId, err);
              candidateName = data.userId.substring(0, 8) + '...';
            }
          }

          allResults.push({
            id: examDoc.id,
            ...data,
            candidateName, // Attach the resolved username/name here
          });
        }

        // Sort by newest date/timestamp first
        allResults.sort((a, b) => {
          const timeA = a.date ? new Date(a.date).getTime() : 0;
          const timeB = b.date ? new Date(b.date).getTime() : 0;
          return timeB - timeA;
        });

        setResults(allResults);
      } catch (error) {
        console.error('Error fetching admin exam records:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllResultsWithProfiles();
  }, []);

  // Filter logic updated to search by candidate name or subject
  const filteredResults = results.filter((item) => {
    const matchesSearch = 
      (item.candidateName && item.candidateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.subject && item.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = selectedSubject === 'All' || item.subject?.toLowerCase() === selectedSubject.toLowerCase();
    
    return matchesSearch && matchesSubject;
  });

  const totalSubmissions = results.length;
  const averageScore = totalSubmissions > 0 
    ? Math.round(results.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / totalSubmissions) 
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-sm">Loading candidate profiles and scores...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administrator Portal</h1>
          <p className="text-slate-500 text-sm">Monitor candidate usernames, submissions, scores, and exam history.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 text-center">
            <span className="block text-xs font-semibold text-blue-600 uppercase">Submissions</span>
            <span className="text-xl font-bold text-blue-900">{totalSubmissions}</span>
          </div>
          <div className="bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 text-center">
            <span className="block text-xs font-semibold text-emerald-600 uppercase">Avg Score</span>
            <span className="text-xl font-bold text-emerald-900">{averageScore}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
        <input
          type="text"
          placeholder="Search by Username or Subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="All">All Subjects</option>
          <option value="Use of English">Use of English</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Biology">Biology</option>
        </select>
      </div>

      {/* Results Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="px-6 py-4">Candidate Username</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Total Questions</th>
                <th className="px-6 py-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredResults.length > 0 ? (
                filteredResults.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs uppercase font-bold">
                        {record.candidateName.charAt(0)}
                      </div>
                      <span className="truncate max-w-xs">{record.candidateName}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {record.subject || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                        {record.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {record.totalQuestions || 40}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {record.date ? new Date(record.date).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    No exam result records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}