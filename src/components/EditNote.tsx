// src/components/EditNote.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import MonacoEditor from "@monaco-editor/react";
import ToggleSwitch from "./toggle"; // Import the ToggleSwitch component

const EditNote: React.FC = () => {
  const { currentUser } = useAuth();
  const { noteId } = useParams<{ noteId: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [useMonacoEditor, setUseMonacoEditor] = useState(false); // Default to Text Editor
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNote = async () => {
      if (currentUser && noteId) {
        const noteDocRef = doc(
          db,
          "users",
          currentUser.email!,
          "notes",
          noteId,
        );
        const noteDoc = await getDoc(noteDocRef);
        if (noteDoc.exists()) {
          const noteData = noteDoc.data();
          setTitle(noteData.title);
          setContent(noteData.content);
          setCategory(noteData.category);
        } else {
          console.error("No such note!");
        }
      }
    };

    fetchNote();
  }, [currentUser, noteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser && noteId) {
        const noteDocRef = doc(
          db,
          "users",
          currentUser.email!,
          "notes",
          noteId,
        );
        await updateDoc(noteDocRef, {
          title,
          content,
          category,
          updatedAt: new Date(), // Optional: you can track when the note was last updated
        });
        navigate("/dashboard"); // Redirect back to the dashboard after updating
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleCancel = () => {
    navigate(`/note/${noteId}`); // Navigate back to the dashboard or the previous page
  };

  const handleToggle = () => {
    setUseMonacoEditor(!useMonacoEditor); // Toggle between editors
  };

  return (
    <div className="p-6 max-w-site mx-auto container">
      <h2 className="text-3xl font-bold mb-4">Edit Note</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          >
            <option value="" disabled>
              Select a category
            </option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="School">School</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Toggle Switch for Editor */}
        <div className="mb-4 flex items-center">
          <span className="mr-3 text-gray-700">
            {useMonacoEditor ? "Code Editor" : "Text Editor"}
          </span>
          <ToggleSwitch isOn={useMonacoEditor} onToggle={handleToggle} />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Content (Markdown supported)
          </label>
          <div className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
            {useMonacoEditor ? (
              <MonacoEditor
                height="400px"
                language="markdown"
                theme="vs-dark"
                value={content}
                onChange={(value) => setContent(value || "")}
                options={{
                  selectOnLineNumbers: true,
                }}
              />
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full h-64 border border-gray-300 rounded-md p-2"
                rows={10}
              ></textarea>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-2">Preview</h3>
        <div className="prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default EditNote;
