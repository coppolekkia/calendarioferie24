import { useState, useEffect } from 'react';
import { LeaveRecord, LeaveType, Person } from '@/types';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, deleteField } from 'firebase/firestore';

const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
];

export function useLeaveStore(projectId: string | null) {
  const [people, setPeople] = useState<Person[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setPeople([]);
      setLeaves({});
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'projects', projectId, 'people'), (snapshot) => {
      const newPeople: Person[] = [];
      const newLeaves: LeaveRecord = {};
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        newPeople.push({
          id: docSnap.id,
          name: data['name'],
          colorClass: data['colorClass'],
          monthStr: data['monthStr'],
        });
        newLeaves[docSnap.id] = data['leaves'] || {};
      });
      
      setPeople(newPeople);
      setLeaves(newLeaves);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching people:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const addPerson = async (name: string, monthStr: string) => {
    if (!projectId) return;
    const finalName = name.trim();
    const newId = Math.random().toString(36).substring(2, 9);
    const newPerson = {
      name: finalName,
      colorClass: AVATAR_COLORS[people.length % AVATAR_COLORS.length]!,
      leaves: {},
      monthStr
    };
    
    // Optimistic update
    setPeople(prev => [...prev, { id: newId, ...newPerson }]);
    setLeaves(prev => ({ ...prev, [newId]: {} }));
    
    try {
      await setDoc(doc(db, 'projects', projectId, 'people', newId), newPerson);
    } catch (e) {
      console.error("Error adding person:", e);
    }
  };

  const removePerson = async (id: string) => {
    if (!projectId) return;
    // Optimistic update
    setPeople(prev => prev.filter(p => p.id !== id));
    setLeaves(prev => {
      const newLeaves = { ...prev };
      delete newLeaves[id];
      return newLeaves;
    });

    try {
      await deleteDoc(doc(db, 'projects', projectId, 'people', id));
    } catch (e) {
      console.error("Error removing person:", e);
    }
  };

  const updatePersonName = async (id: string, newName: string) => {
    if (!projectId) return;
    // Optimistic update
    setPeople(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    
    try {
      await updateDoc(doc(db, 'projects', projectId, 'people', id), { name: newName });
    } catch (e) {
      console.error("Error updating person:", e);
    }
  };

  const toggleLeave = async (personId: string, dateStr: string, type: LeaveType) => {
    if (!projectId) return;
    const personLeaves = leaves[personId] || {};
    const isSameType = personLeaves[dateStr] === type;
    
    // Optimistic update
    setLeaves(prev => {
      const newPersonLeaves = { ...(prev[personId] || {}) };
      if (isSameType) {
        delete newPersonLeaves[dateStr];
      } else {
        newPersonLeaves[dateStr] = type;
      }
      return {
        ...prev,
        [personId]: newPersonLeaves
      };
    });

    try {
      const docRef = doc(db, 'projects', projectId, 'people', personId);
      if (isSameType) {
        await updateDoc(docRef, {
          [`leaves.${dateStr}`]: deleteField()
        });
      } else {
        await updateDoc(docRef, {
          [`leaves.${dateStr}`]: type
        });
      }
    } catch (e) {
      console.error("Error toggling leave:", e);
    }
  };

  const copyPeopleFromMonth = async (fromMonthStr: string, toMonthStr: string) => {
    if (!projectId) return;
    
    // Trova le persone del mese precedente
    const peopleToCopy = people.filter(p => p.monthStr === fromMonthStr || !p.monthStr);
    
    // Evita di copiare chi esiste già in toMonthStr (basato sul nome)
    const existingNamesInToMonth = people.filter(p => p.monthStr === toMonthStr).map(p => p.name.toLowerCase());
    
    const newPeopleToAdd = peopleToCopy.filter(p => !existingNamesInToMonth.includes(p.name.toLowerCase()));
    
    if (newPeopleToAdd.length === 0) return;

    for (const p of newPeopleToAdd) {
      await addPerson(p.name, toMonthStr);
    }
  };

  return {
    people,
    leaves,
    loading,
    addPerson,
    removePerson,
    updatePersonName,
    toggleLeave,
    copyPeopleFromMonth,
  };
}

