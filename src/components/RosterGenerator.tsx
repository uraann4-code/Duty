import React, { useState, useEffect } from 'react';
import { rosterService, Employee, DutyAssignment, Designation } from '../services/rosterService';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday, isWithinInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BLOCK_REQUIREMENTS = [
  { 
    name: 'Sir Syed', 
    roles: [
      { designation: 'Lab Assistant' as const, count: 1, allowedDesignations: ['Lab Assistant', 'Assistant Lab Engineer', 'Jr. Lab Assistant', 'Lab Technician'] },
      { designation: 'MMO' as const, count: 1, allowedDesignations: ['M. M. Operator', 'IT Incharge', 'IT Assistant'] },
      { designation: 'Lab Attendant' as const, count: 1, allowedDesignations: ['Lab Attendant', 'Jr. Lab Assistant'] }
    ] 
  },
  { 
    name: 'Business School', 
    roles: [
      { designation: 'Lab Assistant' as const, count: 1, allowedDesignations: ['Lab Assistant', 'Assistant Lab Engineer', 'Jr. Lab Assistant', 'Lab Technician'] },
      { designation: 'MMO' as const, count: 1, allowedDesignations: ['M. M. Operator', 'IT Incharge', 'IT Assistant'] },
      { designation: 'Lab Attendant' as const, count: 1, allowedDesignations: ['Lab Attendant', 'Jr. Lab Assistant'] }
    ] 
  },
  { 
    name: 'Iqbal Block', 
    roles: [
      { designation: 'Any' as const, count: 1, allowedDesignations: ['Lab Assistant', 'Assistant Lab Engineer', 'M. M. Operator', 'Lab Attendant', 'Jr. Lab Assistant', 'Lab Technician', 'Naib Qasid'] }
    ] 
  },
  { 
    name: 'Quaid Block', 
    roles: [
      { designation: 'Lab Attendant' as const, count: 1, allowedDesignations: ['Lab Attendant', 'Jr. Lab Assistant'] }
    ] 
  }
] as const;

export function RosterGenerator({ onComplete }: { onComplete: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [workingDays, setWorkingDays] = useState({
    1: true, // Mon
    2: true, // Tue
    3: true, // Wed
    4: true, // Thu
    5: true, // Fri
    6: false, // Sat
    0: false, // Sun
  });
  const [onLeaveIds, setOnLeaveIds] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<DutyAssignment[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'config' | 'leave' | 'preview'>('config');

  useEffect(() => {
    rosterService.getEmployees().then(setEmployees);
  }, []);

  const generateRoster = () => {
    setBusy(true);
    const dateInterval = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate)
    });

    const activeEmployees = employees.filter(e => e.isActive && !onLeaveIds.includes(e.id));
    
    if (activeEmployees.length < 8) {
      alert("Not enough staff available (considering leaves). Need at least 8.");
      setBusy(false);
      return;
    }

    let tempEmployees = activeEmployees.map(e => ({ ...e }));
    const newAssignments: DutyAssignment[] = [];

    dateInterval.forEach(day => {
      const dayOfWeek = day.getDay() as keyof typeof workingDays;
      if (!workingDays[dayOfWeek]) return;

      const dateStr = format(day, 'yyyy-MM-dd');
      let assignedToday: string[] = [];

      const getSortedAvailable = (allowed: string[]) => {
        return tempEmployees
          .filter(e => !assignedToday.includes(e.id) && allowed.includes(e.designation))
          .sort((a, b) => {
            if (a.dutyCount !== b.dutyCount) return a.dutyCount - b.dutyCount;
            if (!a.lastDutyDate) return -1;
            if (!b.lastDutyDate) return 1;
            return new Date(a.lastDutyDate).getTime() - new Date(b.lastDutyDate).getTime();
          });
      };

      BLOCK_REQUIREMENTS.forEach(block => {
        block.roles.forEach(roleReq => {
          for (let i = 0; i < roleReq.count; i++) {
            const available = getSortedAvailable(roleReq.allowedDesignations as unknown as string[]);
            
            if (available.length > 0) {
              const selected = available[0];
              
              newAssignments.push({
                id: crypto.randomUUID(),
                date: dateStr,
                block: block.name as any,
                role: roleReq.designation,
                staffIds: [selected.id],
                createdAt: new Date().toISOString()
              });

              selected.dutyCount += 1;
              selected.lastDutyDate = dateStr;
              assignedToday.push(selected.id);
            }
          }
        });
      });
    });

    setAssignments(newAssignments);
    setStep('preview');
    setBusy(false);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      // Group employee updates
      const employeeUpdates: { [id: string]: { dutyCount: number, lastDutyDate: string } } = {};
      assignments.forEach(asgn => {
        asgn.staffIds.forEach(id => {
          employeeUpdates[id] = {
            dutyCount: (employees.find(e => e.id === id)?.dutyCount || 0) + 1,
            lastDutyDate: asgn.date
          };
        });
      });

      await rosterService.saveRoster(assignments, employeeUpdates);
      onComplete();
    } catch (err) {
      console.error(err);
      alert("Failed to save roster");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="roster-generator-root" className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Roster Generator</h1>
        <p className="text-gray-500">Create a fair duty schedule for your team.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'config' ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="text-sm font-semibold text-gray-700">Working Days of Week</label>
              <div className="flex flex-wrap gap-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <button
                    key={day}
                    onClick={() => setWorkingDays(prev => ({ ...prev, [i]: !prev[i as keyof typeof workingDays] }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      workingDays[i as keyof typeof workingDays] 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 mb-8">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Duty Distribution Plan (After 4 PM)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                <p><strong>Sir Syed Block:</strong> 1 Asst, 1 MMO, 1 Attendant</p>
                <p><strong>Business School:</strong> 1 Asst, 1 MMO, 1 Attendant</p>
                <p><strong>Iqbal Block:</strong> 1 Person (Any)</p>
                <p><strong>Quaid Block:</strong> 1 Lab Attendant</p>
              </div>
              <p className="mt-4 text-xs text-gray-500 italic">
                *Fairness logic: Least duties performed + longest time since last duty.
              </p>
            </div>

            <button
              onClick={() => setStep('leave')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Next: Select Staff on Leave
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        ) : step === 'leave' ? (
          <motion.div
            key="leave"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Select Staff on Leave</h2>
              <button 
                onClick={() => setOnLeaveIds([])}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 font-urdu">
              Select staff members who are on leave for the chosen period ({startDate} to {endDate}). These members will not be included in the roster.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setOnLeaveIds(prev => 
                    prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                  )}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    onLeaveIds.includes(emp.id)
                      ? 'bg-red-50 border-red-200 ring-1 ring-red-100'
                      : 'bg-white border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${onLeaveIds.includes(emp.id) ? 'text-red-700' : 'text-gray-900'}`}>
                      {emp.name}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase">{emp.designation}</p>
                  </div>
                  {onLeaveIds.includes(emp.id) && (
                    <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded">Leave</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('config')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={generateRoster}
                disabled={busy}
                className="flex-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {busy ? 'Generating...' : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Weekly Roster
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('leave')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to settings
              </button>
              <button
                onClick={handleSave}
                disabled={busy}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-green-100"
              >
                <Save className="w-4 h-4" />
                Confirm & Save to Cloud
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 bg-blue-600 text-white flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Roster Preview: {assignments.length} assignments generated</span>
               </div>
               <div className="max-h-[600px] overflow-y-auto">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Block</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Assigned Staff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignments.map((asgn, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {format(parseISO(asgn.date), 'EEE, MMM d')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                              {asgn.block}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {asgn.staffIds.map(id => (
                                <span key={id} className="text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded">
                                  {employees.find(e => e.id === id)?.name || 'Unknown'}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
