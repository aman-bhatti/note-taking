import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { collection, query, getDocs, doc, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import GraphView from "./NoteTree"; // Import the GraphView component
import EChartsTreeView from "./TreeChart"; // Import the ECharts TreeView component
import { FaList, FaProjectDiagram, FaSitemap } from "react-icons/fa"; // Import icons

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "graph" | "tree">("list"); // State for view mode
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
        const q = query(notesCollectionRef, orderBy("createdAt", "desc"));
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

  const openNote = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const createNewNote = () => {
    navigate("/new-note");
  };

  const toggleViewMode = () => {
    setViewMode((prevMode) => {
      if (prevMode === "list") return "graph";
      if (prevMode === "graph") return "tree";
      return "list";
    });
  };

  const renderIcon = () => {
    if (viewMode === "list") return <FaList />;
    if (viewMode === "graph") return <FaProjectDiagram />;
    return <FaSitemap />;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              My Notes - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}{" "}
              View
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={toggleViewMode}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-transform transform hover:scale-105 flex items-center"
                title={`Switch to ${viewMode === "list" ? "Graph View" : viewMode === "graph" ? "Tree View" : "List View"}`}
              >
                {renderIcon()}
              </button>
              <button
                onClick={createNewNote}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
              >
                + Create New Note
              </button>
            </div>
          </div>

          {viewMode === "list" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => openNote(note.id)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {note.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-2">
                      {new Date(
                        note.createdAt.seconds * 1000,
                      ).toLocaleDateString()}
                    </p>
                    {note.category && (
                      <span className="inline-block bg-gray-200 text-gray-800 text-xs font-medium mt-3 px-2 py-1 rounded-full">
                        {note.category}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center col-span-full">
                  No notes available. Start by creating a new note!
                </p>
              )}
            </div>
          )}

          {viewMode === "graph" && <GraphView />}

          {viewMode === "tree" && <EChartsTreeView />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
