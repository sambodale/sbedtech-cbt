import React from 'react';
import { usePaystackPayment } from 'react-paystack';

export default function PaystackModal({ 
  isOpen, 
  onClose, 
  userEmail, 
  userName, 
  userId, 
  onSuccess, 
  amount = 300000 // Default to ₦3,000 in kobo
}) {
  if (!isOpen) return null;

  // Pull your public key from Vite env
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_3072de9f1cf99dbfde94a1f33d1d2da5c47ce4a7';

  const config = {
    reference: `SBED-${Date.now()}`,
    email: userEmail || 'candidate@sbedtech.com',
    amount: amount,
    publicKey: publicKey,
    metadata: {
      custom_fields: [
        {
          display_name: "Candidate Name",
          variable_name: "candidate_name",
          value: userName || 'N/A'
        },
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: userId || 'guest_user'
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaystackSuccessAction = (reference) => {
    console.log('Payment successful. Reference:', reference);
    if (onSuccess) {
      onSuccess(reference);
    }
    onClose();
  };

  const handlePaystackCloseAction = () => {
    console.log('Payment modal closed by user.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-center text-white space-y-5">
        
        {/* Header Icon */}
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 text-2xl border border-emerald-500/20 shadow-inner">
          💳
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-white">Unlock Full Exam Mode</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Make a secure online payment of <span className="font-semibold text-emerald-400">₦{amount / 100}</span> via Paystack for instant full access.
          </p>
        </div>

        {/* User Details Preview Box */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/60 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Candidate Name:</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px]">{userName || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-slate-700/40">
            <span className="text-slate-400">Billing Email:</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px]">{userEmail || 'N/A'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition text-xs border border-slate-700 shadow-sm"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => {
              initializePayment({
                onSuccess: handlePaystackSuccessAction,
                onClose: handlePaystackCloseAction,
              });
            }}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black transition shadow-lg shadow-emerald-900/20 text-xs flex items-center justify-center gap-2"
          >
            Pay Now 🚀
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
          <span>🔒 Secured by Paystack</span>
        </div>

      </div>
    </div>
  );
}