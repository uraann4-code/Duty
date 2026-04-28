import React, { useState, useEffect } from 'react';
import { rosterService, Employee, Designation } from '../services/rosterService';
import { UserPlus, Trash2, Search, ArrowUpDown, Briefcase, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesignation, setNewDesignation] = useState<Designation>('Lab Assistant');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const data = await rosterService.getEmployees();
    setEmployees(data);
    setLoading(false);
  };

  const designations: Designation[] = [
    'Assistant Lab Engineer',
    'IT Incharge',
    'Lab Assistant',
    'Lab Technician',
    'IT Assistant',
    'Jr. Lab Assistant',
    'M. M. Operator',
    'Lab Attendant'
  ];

  const seedData = async () => {
    if (!confirm('This will add the 28 staff members from the provided list. Continue?')) return;
    const initialStaff: { name: string, designation: Designation }[] = [
      { name: "Mr. Rehan Akhtar", designation: "Assistant Lab Engineer" },
      { name: "Mr. M. Ali Asif Khan", designation: "IT Incharge" },
      { name: "Mr. Muhammad Asif", designation: "Assistant Lab Engineer" },
      { name: "Mr. Babar Nazir Malik", designation: "Assistant Lab Engineer" },
      { name: "Ms. Aqsa Rehman", designation: "Assistant Lab Engineer" },
      { name: "Mr. Abdul Rahman Khan", designation: "Assistant Lab Engineer" },
      { name: "Mr. Tayyab Riaz", designation: "Assistant Lab Engineer" },
      { name: "Mr. M Intikhab Alam", designation: "Lab Assistant" },
      { name: "Mr. Raja Ali Imran", designation: "Lab Assistant" },
      { name: "Mr. Ishtiaq Ahmed", designation: "Lab Assistant" },
      { name: "Mr. Ali Sarmad Khan", designation: "Lab Assistant" },
      { name: "Mr. Adil Shah Gilani", designation: "Lab Assistant" },
      { name: "Mr. Zohaib Farid", designation: "Lab Technician" },
      { name: "Mr. Moheed Afzal Khan", designation: "Lab Technician" },
      { name: "Mr. Muhammad Riaz", designation: "IT Assistant" },
      { name: "Mr. Zahid Hussain", designation: "Lab Technician" },
      { name: "Mr. Ihtesham Khan", designation: "Lab Assistant" },
      { name: "Mr. Muhammad Shahzad", designation: "Jr. Lab Assistant" },
      { name: "Mr. Abdul Salam", designation: "Lab Assistant" },
      { name: "Mr. Mohsin Imtiaz", designation: "Lab Assistant" },
      { name: "Mr. Muhammad Adil", designation: "Lab Assistant" },
      { name: "Mr. M Hammad Nawaz", designation: "Lab Technician" },
      { name: "Mr. Jahanzaib Nazir", designation: "Lab Assistant" },
      { name: "Mr. Muhammad Waseem", designation: "Lab Assistant" },
      { name: "Mr. Mohsin Iqbal", designation: "Jr. Lab Assistant" },
      { name: "Mr. Junaid Adnan", designation: "Jr. Lab Assistant" },
      { name: "Mr. Sajid Hussain", designation: "M. M. Operator" },
      { name: "Mr. Aqib Javed", designation: "M. M. Operator" }
    ];
    await rosterService.seedInitialEmployees(initialStaff);
    loadEmployees();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await rosterService.addEmployee(newName.trim(), newDesignation);
    setNewName('');
    loadEmployees();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this employee?')) {
      await rosterService.deleteEmployee(id);
      loadEmployees();
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (a.designation !== b.designation) return a.designation.localeCompare(b.designation);
    return a.dutyCount - b.dutyCount;
  });

  return (
    <div id="employee-manager-root" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500">Manage your office staff ({employees.length}/53)</p>
          <button 
            onClick={seedData}
            className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Import Provided List (28 People)
          </button>
        </div>
        
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New employee name"
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <select
            value={newDesignation}
            onChange={(e) => setNewDesignation(e.target.value as Designation)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
          >
            {designations.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Sorted by Designation
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Designation</th>
                <th className="px-6 py-4 font-semibold text-center">Total Duties</th>
                <th className="px-6 py-4 font-semibold">Last Duty</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading employees...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <motion.tr 
                    layout
                    key={emp.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{emp.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-3 h-3 text-blue-500" />
                        {emp.designation}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        emp.dutyCount === 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {emp.dutyCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {emp.lastDutyDate ? new Date(emp.lastDutyDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
