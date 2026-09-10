import React from 'react';

export default function Header({
  activeUserProfile,
  currentView,
  onNavigate,
  isActivated = false,
  onOpenActivation,
  onLogout,
}) {
  const isAdmin = activeUserProfile?.role === 'admin';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* BRAND / LOGO */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => onNavigate('home')}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow">
            S
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-none">
              SbedTech <span className="text-blue-500">CBT</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wide">
              JAMB / UTME Prep
            </span>
          </div>
        </div>

        {/* NAVIGATION & PROFILE CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* HOME BUTTON */}
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              currentView === 'home'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Home
          </button>

          {/* HISTORY BUTTON */}
          <button
            onClick={() => onNavigate('history')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              currentView === 'history'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            History
          </button>

          {/* ADMIN CONSOLE TRIGGER BUTTON (Visible only when role === 'admin') */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow ${
                currentView === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-950/80 text-purple-300 border border-purple-800 hover:bg-purple-900'
              }`}
            >
              <span>🛡️</span>
              <span>Admin Console</span>
            </button>
          )}

          {/* ACTIVATION BUTTON (If student is not activated) */}
          {!isActivated && !isAdmin && (
            <button
              onClick={onOpenActivation}
              className="px-3 py-1.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow transition"
            >
              Activate Mode
            </button>
          )}

          {/* PROFILE / USER INFO */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-xs text-slate-300">
              {activeUserProfile?.fullName ? activeUserProfile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-200 leading-tight">
                {activeUserProfile?.fullName || 'User'}
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {activeUserProfile?.role || 'student'}
              </span>
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-1 px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
              title="Sign Out"
            >
              🚪
            </button>
          )}

        </div>

      </div>
    </header>
  );
}