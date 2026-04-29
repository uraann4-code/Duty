import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  increment,
  getDoc,
  deleteDoc,
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type Designation = 
  | 'Assistant Lab Engineer' 
  | 'IT Incharge' 
  | 'Lab Assistant' 
  | 'Lab Technician' 
  | 'IT Assistant' 
  | 'Jr. Lab Assistant' 
  | 'M. M. Operator' 
  | 'Lab Attendant'
  | 'Naib Qasid';

export interface Employee {
  id: string;
  name: string;
  designation: Designation;
  dutyCount: number;
  lastDutyDate: string | null;
  isActive: boolean;
}

export interface DutyAssignment {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  block: 'Sir Syed' | 'Business School' | 'Iqbal' | 'Quaid';
  role: string; // Specific role for that block
  staffIds: string[];
  createdAt: string;
}

export const rosterService = {
  async getEmployees(): Promise<Employee[]> {
    try {
      const q = query(collection(db, 'employees'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'employees');
      return [];
    }
  },

  async addEmployee(name: string, designation: Designation): Promise<void> {
    const id = crypto.randomUUID();
    const employee: Employee = {
      id,
      name,
      designation,
      dutyCount: 0,
      lastDutyDate: null,
      isActive: true
    };
    try {
      await setDoc(doc(db, 'employees', id), employee);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `employees/${id}`);
    }
  },

  async seedInitialEmployees(staff: { name: string, designation: Designation }[]): Promise<void> {
    const batch = writeBatch(db);
    staff.forEach(item => {
      const id = crypto.randomUUID();
      const docRef = doc(db, 'employees', id);
      batch.set(docRef, {
        id,
        name: item.name,
        designation: item.designation,
        dutyCount: 0,
        lastDutyDate: null,
        isActive: true
      });
    });
    await batch.commit();
  },

  async deleteEmployee(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
    }
  },

  async saveRoster(assignments: DutyAssignment[], employeeUpdates: { [id: string]: { dutyCount: number, lastDutyDate: string } }): Promise<void> {
    const batch = writeBatch(db);
    
    try {
      // Save assignments
      assignments.forEach(asgn => {
        const dRef = doc(db, 'duties', asgn.id);
        batch.set(dRef, asgn);
      });

      // Update employee stats
      Object.entries(employeeUpdates).forEach(([id, stats]) => {
        const eRef = doc(db, 'employees', id);
        batch.update(eRef, {
          dutyCount: increment(1),
          lastDutyDate: stats.lastDutyDate
        });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-roster');
    }
  },

  async getDuties(startDate: string, endDate: string): Promise<DutyAssignment[]> {
    try {
      const q = query(
        collection(db, 'duties'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DutyAssignment);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'duties');
      return [];
    }
  },

  async clearDuties(startDate: string, endDate: string): Promise<void> {
    // This is useful for regenerating
    try {
      const q = query(
        collection(db, 'duties'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'duties-range');
    }
  }
};
