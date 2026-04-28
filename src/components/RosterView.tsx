import React, { useState, useEffect } from 'react';
import { rosterService, DutyAssignment, Employee } from '../services/rosterService';
import { format, startOfMonth, endOfMonth, parseISO, isToday } from 'date-fns';
import { Filter, Calendar as CalendarIcon, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export function RosterView() {
  const [duties, setDuties] = useState<DutyAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    
    const [dutiesData, employeesData] = await Promise.all([
      rosterService.getDuties(start, end),
      rosterService.getEmployees()
    ]);
    
    setDuties(dutiesData);
    setEmployees(employeesData);
    setLoading(false);
  };

  const nextMonth = () => setCurrentMonth(prev => addMonth(prev, 1));
  const prevMonth = () => setCurrentMonth(prev => addMonth(prev, -1));

  function addMonth(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  // Group duties by date
  const groupedDuties = duties.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as { [key: string]: DutyAssignment[] });

  const sortedDates = Object.keys(groupedDuties).sort();

  return (
    <div id="employee-manager-container" className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          </div>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Showing {duties.length} assignments</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
           <p className="text-gray-500 italic">Fetching Cloud Data...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
           <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
           <p className="text-gray-900 font-medium">No duty assignments for this month.</p>
           <p className="text-gray-500 text-sm">Use the Roster Generator to create a schedule.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedDates.map(date => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={date}
              className={`bg-white rounded-2xl shadow-sm border ${
                isToday(parseISO(date)) ? 'border-blue-400 ring-2 ring-blue-50' : 'border-gray-200'
              } overflow-hidden`}
            >
              <div className={`px-6 py-4 border-b flex justify-between items-center ${
                isToday(parseISO(date)) ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{format(parseISO(date), 'EEEE')}</span>
                    {isToday(parseISO(date)) && (
                      <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Today</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{format(parseISO(date), 'MMMM d, yyyy')}</div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {groupedDuties[date].map((asgn, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      {asgn.block}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {asgn.staffIds.map(id => {
                        const employee = employees.find(e => e.id === id);
                        return (
                          <div key={id} className="w-full flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {employee?.name || 'Loading...'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                              {asgn.role}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
