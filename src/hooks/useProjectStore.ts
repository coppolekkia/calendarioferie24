import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
}

export function useProjectStore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('currentProjectId') || null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const newProjects: Project[] = [];
      snapshot.forEach((docSnap) => {
        newProjects.push({
          id: docSnap.id,
          name: docSnap.data()['name'] || 'Progetto Senza Nome',
        });
      });
      setProjects(newProjects);
      
      if (newProjects.length > 0 && !currentProjectId) {
        setCurrentProjectId(newProjects[0]!.id);
        localStorage.setItem('currentProjectId', newProjects[0]!.id);
      } else if (newProjects.length === 0) {
        // Auto-create a default project if none exist
        addProject('Progetto Default');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentProjectId]);

  const switchProject = (id: string) => {
    setCurrentProjectId(id);
    localStorage.setItem('currentProjectId', id);
  };

  const addProject = async (name: string) => {
    const finalName = name.trim() || 'Nuovo Progetto';
    const newId = Math.random().toString(36).substring(2, 9);
    
    // Optimistic
    const newProject = { id: newId, name: finalName };
    setProjects(prev => [...prev, newProject]);
    
    if (!currentProjectId) {
      switchProject(newId);
    }
    
    try {
      await setDoc(doc(db, 'projects', newId), { name: finalName });
      return newId;
    } catch (e) {
      console.error("Error adding project:", e);
      return null;
    }
  };

  const removeProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
      if (currentProjectId === id) {
        const remaining = projects.filter(p => p.id !== id);
        if (remaining.length > 0) {
          switchProject(remaining[0]!.id);
        } else {
          setCurrentProjectId(null);
          localStorage.removeItem('currentProjectId');
        }
      }
    } catch (e) {
      console.error("Error removing project:", e);
    }
  };
  
  const updateProjectName = async (id: string, newName: string) => {
    // Optimistic
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    try {
      await updateDoc(doc(db, 'projects', id), { name: newName });
    } catch (e) {
      console.error("Error updating project name:", e);
    }
  };

  return {
    projects,
    currentProjectId,
    loading,
    switchProject,
    addProject,
    removeProject,
    updateProjectName
  };
}
