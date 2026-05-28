import { db } from '@/app/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  increment,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// Types
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'in_progress' | 'completed' | 'missed';
export type TaskType = 'short' | 'long';

export interface TaskData {
  id?: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  type: TaskType;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  progress?: number; // Cho Long term
  longTaskId?: string | null; // Cho Short term liên kết
  createdAt?: Timestamp;
}

const TASKS_COLLECTION = 'tasks';

// 1. Thêm Task mới
export const addTask = async (taskData: Omit<TaskData, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      ...taskData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

// 2. Lấy Task (Có filter theo loại)
export const getTasks = async (userId: string, type?: TaskType) => {
  try {
    let q = query(
      collection(db, TASKS_COLLECTION),
      where("userId", "==", userId),
      orderBy("endDate", "asc")
    );

    if (type) {
      q = query(q, where("type", "==", type));
    }

    const querySnapshot = await getDocs(q);
    const tasks: TaskData[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as TaskData);
    });

    return tasks;
  } catch (error) {
    console.error("Error getting tasks: ", error);
    throw error;
  }
};

// 3. Cập nhật Status / Data của Task
export const updateTask = async (taskId: string, updatedData: Partial<TaskData>) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, updatedData);
  } catch (error) {
    console.error("Error updating task: ", error);
    throw error;
  }
};

// 4. Xóa Vĩnh Viễn Một Task (Hard Delete)
export const deleteTask = async (taskId: string) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error("Error deleting task: ", error);
    throw error;
  }
};

// 5. Xóa Vĩnh Viễn Nhiều Task (Batch Delete)
export const deleteMultipleTasks = async (taskIds: string[]) => {
  try {
    if (taskIds.length === 0) return;
    
    const allLinkedTaskIds: string[] = [];
    for (let i = 0; i < taskIds.length; i += 10) {
      const chunk = taskIds.slice(i, i + 10);
      const q = query(collection(db, TASKS_COLLECTION), where("longTaskId", "in", chunk));
      const snap = await getDocs(q);
      snap.forEach(doc => allLinkedTaskIds.push(doc.id));
    }
    
    const finalIdsToDelete = [...taskIds, ...allLinkedTaskIds];
    const deletePromises = finalIdsToDelete.map(id => deleteDoc(doc(db, TASKS_COLLECTION, id)));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error batch deleting tasks: ", error);
    throw error;
  }
};

// --- COMMITS MANAGEMENT (NHẬT KÝ NEO ĐẬU & LA BÀN) ---
export interface CommitData {
  id?: string;
  taskId: string;
  userId: string;
  title: string;
  description: string;
  oldProgress: number;
  newProgress: number;
  createdAt: Timestamp;
}

const COMMITS_COLLECTION = 'commits';

// Lấy lịch sử commits của một Task
export const getCommitsByTask = async (taskId: string) => {
  try {
    // Bỏ orderBy trong query để tránh lỗi thiếu Composite Index của Firebase
    // Thay vào đó, chúng ta sẽ sort (sắp xếp) mảng ở phía client
    const q = query(
      collection(db, COMMITS_COLLECTION),
      where("taskId", "==", taskId)
    );
    const querySnapshot = await getDocs(q);
    const commits: CommitData[] = [];
    querySnapshot.forEach((doc) => {
      commits.push({ id: doc.id, ...doc.data() } as CommitData);
    });

    // Sắp xếp commits mới nhất lên đầu
    commits.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return commits;
  } catch (error) {
    console.error("Error getting commits: ", error);
    throw error;
  }
};

// Thêm một commit mới
export const addCommit = async (commitData: Omit<CommitData, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, COMMITS_COLLECTION), {
      ...commitData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding commit: ", error);
    throw error;
  }
};

// --- GOLD / CURRENCY MANAGEMENT ---
export const getGold = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data()?.gold || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error getting gold: ", error);
    return 0;
  }
};

export const addGold = async (userId: string, amount: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { gold: increment(amount) }, { merge: true });
  } catch (error) {
    console.error("Error adding gold: ", error);
  }
};
