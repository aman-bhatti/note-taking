// src/components/NoteDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const NoteDetail: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const { currentUser } = useAuth();
  const [note, setNote] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNote = async () => {
      if (noteId && currentUser?.email) {
        try {
          const noteDocRef = doc(
            db,
            "users",
            currentUser.email,
            "notes",
            noteId,
          );
          const noteDoc = await getDoc(noteDocRef);
          if (noteDoc.exists()) {
            setNote(noteDoc.data());
          } else {
            console.error("No such document!");
          }
        } catch (error) {
          console.error("Error fetching note:", error);
        }
      } else {
        console.error("noteId or currentUser.email is undefined");
      }
    };

    fetchNote();
  }, [noteId, currentUser]);

  const handleBackToAllNotes = () => {
    navigate("/dashboard");
  };

  if (!note) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 flex-grow container mx-auto px-4 py-4">
      <button
        onClick={handleBackToAllNotes}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Back to All Notes
      </button>
      <h2 className="text-3xl font-bold mb-4">{note.title}</h2>
      <p className="text-sm text-gray-500 mb-6">
        {new Date(note.createdAt.seconds * 1000).toLocaleDateString()}
      </p>
      <div className="prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {note.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default NoteDetail;
