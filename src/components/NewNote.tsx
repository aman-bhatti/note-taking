// src/components/NewNote.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, doc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import MonacoEditor from "@monaco-editor/react";

const NewNote: React.FC = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [useMonacoEditor, setUseMonacoEditor] = useState(true); // Toggle state
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email!);
        const notesCollectionRef = collection(userDocRef, "notes");
        await addDoc(notesCollectionRef, {
          title,
          content,
          createdAt: new Date(),
        });
        navigate("/dashboard"); // Redirect back to the dashboard after creation
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const toggleEditor = () => {
    setUseMonacoEditor(!useMonacoEditor); // Toggle between editors
  };

  return (
    <div className="p-6 max-w-site mx-auto">
      <h2 className="text-3xl font-bold mb-4">Create New Note</h2>
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
            Content (Markdown supported)
          </label>
          <button
            type="button"
            onClick={toggleEditor}
            className="bg-gray-500 text-white px-4 py-2 rounded mb-2"
          >
            Toggle to {useMonacoEditor ? "Text Editor" : "Code Editor"}
          </button>
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
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              rows={10}
            ></textarea>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Note
        </button>
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

export default NewNote;
