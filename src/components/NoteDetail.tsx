// src/components/NoteDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const NoteDetail: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const { currentUser } = useAuth();
  const [note, setNote] = useState<any>(null);
  const navigate = useNavigate();
  const handleEdit = () => {
    navigate(`/edit-note/${noteId}`);
  };

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
    return <div className="container mx-auto">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-site mx-auto container">
      <button
        onClick={handleBackToAllNotes}
        className="text-blue-500 hover:underline rounded mb-4"
      >
        Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
      <div className="mb-4 text-sm text-gray-500">
        <span>Category: {note.category}</span>
        <br />
        {note.updatedAt ? (
          <span>
            Last edited:{" "}
            {new Date(note.updatedAt.seconds * 1000).toLocaleString()}
          </span>
        ) : (
          <span>
            Created on:{" "}
            {new Date(note.createdAt.seconds * 1000).toLocaleString()}
          </span>
        )}
      </div>
      <div className="prose mb-8">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {note.content}
        </ReactMarkdown>
      </div>
      <button
        onClick={handleEdit}
        className="bg-yellow-500 text-white px-4 py-2 rounded mt-4"
      >
        Edit Note
      </button>
    </div>
  );
};

export default NoteDetail;
