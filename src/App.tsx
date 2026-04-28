import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInWithPopup, googleProvider, auth, signOut } from './lib/firebase';
import { EmployeeManager } from './components/EmployeeManager';
import { RosterGenerator } from './components/RosterGenerator';
import { RosterView } from './components/RosterView';
import { Shield, Users, Calendar, LayoutDashboard, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'employees' | 'generator';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <span className="font-bold text-xl text-gray-900">Duty Manager</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Users />} 
            label="Employees" 
            active={activeTab === 'employees'} 
            onClick={() => setActiveTab('employees')} 
          />
          <NavItem 
            icon={<Calendar />} 
            label="Monthly Roster" 
            active={activeTab === 'generator'} 
            onClick={() => setActiveTab('generator')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="px-2 py-4 bg-blue-50 rounded-xl">
             <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Admin Mode</p>
             <p className="text-sm text-blue-900 font-medium">Public Access Enabled</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Staff Duty Dashboard</h2>
              <RosterView />
            </motion.div>
          )}

          {activeTab === 'employees' && (
            <motion.div
              key="employees"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <EmployeeManager />
            </motion.div>
          )}

          {activeTab === 'generator' && (
            <motion.div
              key="generator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RosterGenerator onComplete={() => setActiveTab('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      <span className="text-sm">{label}</span>
    </button>
  );
}
