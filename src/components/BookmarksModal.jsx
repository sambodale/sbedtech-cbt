import React, { useState, useEffect } from 'react';

export default function BookmarksModal({ isOpen, onClose, subject }) {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (isOpen && subject) {
      try {
        const savedIds = JSON.parse(localStorage.getItem(`sbedtech_bookmarks_${subject}`) || '[]');
        setBookmarks(savedIds);
      } catch (e) {
        setBookmarks([]);
      }
    }
  }, [isOpen, subject]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl relative border border-slate-100 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-800">Saved Bookmarks</h2>
            <p className="text-xs text-slate-500">{subject} • {bookmarks.length} saved items</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No bookmarked questions found for {subject}. Click "Bookmark" while taking an exam to save tricky questions here!
            </div>
          ) : (
            bookmarks.map((id, index) => (
              <div key={id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm">
                <span className="text-xs font-bold text-blue-600 uppercase">Saved Question Item #{index + 1}</span>
                <p className="text-slate-700 mt-1">Reference ID: {id}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}