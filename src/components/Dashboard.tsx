// src/components/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { collection, query, getDocs, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { currentUser, userName, logout } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchNotes();
    }
  }, [currentUser]);

  const fetchNotes = async () => {
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email!);
        const notesCollectionRef = collection(userDocRef, "notes");
        const q = query(notesCollectionRef);
        const querySnapshot = await getDocs(q);
        const notesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(notesData);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const openNote = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const createNewNote = () => {
    navigate("/new-note");
  };

  return (
    <div className="flex h-screen">
      <h1 className="text-3xl font-bold mb-4">
        Welcome {userName ? userName : currentUser?.email}!
      </h1>
      <div className="flex-1 p-6 flex-grow container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Notes</h2>
          <div>
            <button
              onClick={createNewNote}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Create New Note
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
        <ul className="list-none mt-4">
          {notes.map((note) => (
            <li
              key={note.id}
              className="mb-4 p-4 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => openNote(note.id)}
            >
              <div>
                <strong>{note.title}</strong> -{" "}
                {new Date(note.createdAt.seconds * 1000).toLocaleDateString()} -{" "}
                {note.category}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
