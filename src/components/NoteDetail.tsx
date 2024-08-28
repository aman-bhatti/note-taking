import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const NoteDetail: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const { currentUser } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [lastEdited, setLastEdited] = useState<Date | null>(null);
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
            const noteData = noteDoc.data();
            setNote(noteData);
            if (noteData.updatedAt) {
              setLastEdited(noteData.updatedAt.toDate());
            } else if (noteData.createdAt) {
              setLastEdited(noteData.createdAt.toDate());
            }
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

  const handleEdit = () => {
    navigate(`/edit-note/${noteId}`);
  };

  const handleBackToAllNotes = () => {
    navigate("/dashboard");
  };

  const handleCheckboxChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const isChecked = e.target.checked;

    if (note && currentUser?.email) {
      try {
        const noteDocRef = doc(
          db,
          "users",
          currentUser.email,
          "notes",
          noteId!,
        );

        const completionDate = isChecked ? new Date() : null;

        await updateDoc(noteDocRef, {
          status: isChecked ? "Complete" : "In Progress",
          completedAt: completionDate,
        });

        // Update corresponding calendar event
        const eventsCollectionRef = collection(
          db,
          "users",
          currentUser.email,
          "events",
        );
        const eventsQuery = query(
          eventsCollectionRef,
          where("title", "==", `LeetCode Note: ${note.title}`),
        );
        const eventSnapshot = await getDocs(eventsQuery);

        eventSnapshot.forEach(async (eventDoc) => {
          await updateDoc(eventDoc.ref, {
            end: completionDate || eventDoc.data().start, // Update end date to current date if completed
            status: isChecked ? "Complete" : "In Progress",
          });
        });

        // Update local state
        setNote({
          ...note,
          status: isChecked ? "Complete" : "In Progress",
          completedAt: completionDate,
        });
      } catch (error) {
        console.error("Error updating note status:", error);
      }
    }
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
        ← Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-4">
        <a href={note.leetcodeLink} target="_blank" rel="noopener noreferrer">
          {note.title}
        </a>
      </h1>
      <div className="mb-4 text-sm text-gray-500">
        <span>Category: {note.category}</span>
        <br />
        {note.completedAt ? (
          <span>
            Completed at: {new Date(note.completedAt).toLocaleString()}
          </span>
        ) : lastEdited ? (
          <span>Last edited: {lastEdited.toLocaleString()}</span>
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

      {note.category === "LeetCode" && (
        <div className="mt-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={note.status === "Complete"}
              onChange={handleCheckboxChange}
              className="form-checkbox h-4 w-4 text-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Mark as Complete</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default NoteDetail;
