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
  Timestamp,
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

            // Set last edited date
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

        // Update the note status and completion date
        await updateDoc(noteDocRef, {
          status: isChecked ? "Complete" : "In Progress",
          completedAt: completionDate
            ? Timestamp.fromDate(completionDate)
            : null,
        });

        // Find and update the corresponding calendar event
        const eventsCollectionRef = collection(
          db,
          "users",
          currentUser.email,
          "events",
        );
        const eventsQuery = query(
          eventsCollectionRef,
          where("title", "==", note.title),
        );
        const eventSnapshot = await getDocs(eventsQuery);

        eventSnapshot.forEach(async (eventDoc) => {
          await updateDoc(eventDoc.ref, {
            status: isChecked ? "Complete" : "In Progress",
            end: completionDate
              ? Timestamp.fromDate(completionDate)
              : eventDoc.data().start, // Update end date to current date if completed
          });
        });

        // Update the local note state to reflect changes
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

  // Safely extract and format dates
  const formattedCreatedAt = note.createdAt
    ? new Date(note.createdAt.seconds * 1000).toLocaleString()
    : "Unknown";
  const formattedUpdatedAt = lastEdited
    ? lastEdited.toLocaleString()
    : "Unknown";

  // Check the type of completedAt and handle accordingly
  const formattedCompletedAt = note.completedAt
    ? note.completedAt instanceof Timestamp
      ? note.completedAt.toDate().toLocaleString()
      : new Date(note.completedAt).toLocaleString()
    : null;

  return (
    <div className="p-6 max-w-site mx-auto container">
      <button
        onClick={handleBackToAllNotes}
        className="text-blue-500 hover:underline rounded mb-4"
      >
        ← Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-4">
        {note.category === "LeetCode" && note.leetcodeLink ? (
          <a href={note.leetcodeLink} target="_blank" rel="noopener noreferrer">
            {note.title}
          </a>
        ) : (
          note.title
        )}
      </h1>
      <div className="mb-4 text-sm text-gray-500">
        <span>Category: {note.category}</span>
        <br />
        <span>Created on: {formattedCreatedAt}</span>
        <br />
        <span>Last edited: {formattedUpdatedAt}</span>
        {note.category === "LeetCode" && formattedCompletedAt && (
          <>
            <br />
            <span>Completed at: {formattedCompletedAt}</span>
          </>
        )}
      </div>
      <div className="prose mb-8">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Override paragraph to avoid wrapping <div> inside <p> if it contains only an image
            p: ({ node, children }) => {
              // Ensure that node and node.children exist
              if (!node || !node.children || node.children.length === 0) {
                return <p>{children}</p>;
              }

              const firstChild = node.children[0];

              // If the first child is an image, don't wrap it in a <p> tag
              if (
                firstChild?.type === "element" &&
                firstChild.tagName === "img"
              ) {
                return <>{children}</>;
              }

              // Otherwise, return the normal <p> element
              return <p>{children}</p>;
            },
            img: ({ node, ...props }) => {
              const src = props.src || "";
              const width = note.imageSizes[src]?.width || "auto";
              const height = note.imageSizes[src]?.height || "auto";

              return (
                <img
                  src={src}
                  alt={props.alt || ""}
                  width={width}
                  height={height}
                  style={{
                    objectFit: "contain",
                    maxWidth: "100%",
                    height: "auto",
                    pointerEvents: "none", // Disable all interactions with the image
                  }}
                />
              );
            },
          }}
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
