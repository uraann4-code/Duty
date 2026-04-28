import React, { useState, useEffect } from 'react';
import { rosterService, Employee, DutyAssignment, Designation } from '../services/rosterService';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday, isWithinInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BLOCK_REQUIREMENTS = [
  { 
    name: 'Sir Syed', 
    roles: [
      { designation: 'Lab Assistant' as Designation, count: 1 },
      { designation: 'MMO' as Designation, count: 1 },
      { designation: 'Lab Attendant' as Designation, count: 1 }
    ] 
  },
  { 
    name: 'Business School', 
    roles: [
      { designation: 'Lab Assistant' as Designation, count: 1 },
      { designation: 'MMO' as Designation, count: 1 },
      { designation: 'Lab Attendant' as Designation, count: 1 }
    ] 
  },
  { 
    name: 'Iqbal Block', 
    roles: [
      { designation: 'Any', count: 1 }
    ] 
  },
  { 
    name: 'Quaid Block', 
    roles: [
      { designation: 'Lab Attendant' as Designation, count: 1 }
    ] 
  }
] as const;

export function RosterGenerator({ onComplete }: { onComplete: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [assignments, setAssignments] = useState<DutyAssignment[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'config' | 'preview'>('config');

  useEffect(() => {
    rosterService.getEmployees().then(setEmployees);
  }, []);

  const generateRoster = () => {
    setBusy(true);
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate)
    });

    const activeEmployees = employees.filter(e => e.isActive);
    if (activeEmployees.length < 8) {
      alert("Not enough active employees. Need at least 8.");
      setBusy(false);
      return;
    }

    // Local copy to track state during generation
    let tempEmployees = activeEmployees.map(e => ({ ...e }));
    const newAssignments: DutyAssignment[] = [];

    days.forEach(day => {
      if (excludeWeekends && (isSaturday(day) || isSunday(day))) return;

      const dateStr = format(day, 'yyyy-MM-dd');
      let assignedToday: string[] = [];

      // Sort helpers
      const getSortedAvailable = (designation?: Designation) => {
        return tempEmployees
          .filter(e => !assignedToday.includes(e.id) && (!designation || e.designation === designation))
          .sort((a, b) => {
            if (a.dutyCount !== b.dutyCount) return a.dutyCount - b.dutyCount;
            if (!a.lastDutyDate) return -1;
            if (!b.lastDutyDate) return 1;
            return new Date(a.lastDutyDate).getTime() - new Date(b.lastDutyDate).getTime();
          });
      };

      // We need to fulfill specific roles first, then generic ones
      BLOCK_REQUIREMENTS.forEach(block => {
        block.roles.forEach(roleReq => {
          for (let i = 0; i < roleReq.count; i++) {
            const available = getSortedAvailable(roleReq.designation === 'Any' ? undefined : roleReq.designation as Designation);
            
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

              // Update in-memory state
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

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl mb-8">
              <input
                type="checkbox"
                id="weekends"
                checked={excludeWeekends}
                onChange={(e) => setExcludeWeekends(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="weekends" className="text-sm font-medium text-blue-900">
                Exclude Weekends (Saturdays & Sundays)
              </label>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 mb-8">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Duty Distribution Check
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                <p><strong>Sir Syed Block:</strong> 1 Asst, 1 MMO, 1 Attendant</p>
                <p><strong>Business School:</strong> 1 Asst, 1 MMO, 1 Attendant</p>
                <p><strong>Iqbal Block:</strong> 1 Person (Any)</p>
                <p><strong>Quaid Block:</strong> 1 Lab Attendant</p>
              </div>
              <p className="mt-4 text-xs text-gray-500 italic">
                *The algorithm will prioritize staff members with the lowest cumulative duty count for fairness.
              </p>
            </div>

            <button
              onClick={generateRoster}
              disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {busy ? 'Generating...' : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Smart Roster
                </>
              )}
            </button>
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
                onClick={() => setStep('config')}
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
