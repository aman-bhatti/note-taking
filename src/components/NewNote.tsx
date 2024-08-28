// src/components/NewNote.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, doc, Timestamp } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import MonacoEditor from "@monaco-editor/react";
import ToggleSwitch from "./toggle"; // Import the ToggleSwitch component

const NewNote: React.FC = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(""); // State for category
  const [leetcodeLink, setLeetcodeLink] = useState(""); // State for LeetCode link
  const [useMonacoEditor, setUseMonacoEditor] = useState(false); // Default to Text Editor
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email!);
        const notesCollectionRef = collection(userDocRef, "notes");
        const noteCreationDate = new Date();

        const newNote = {
          title,
          content,
          category, // Save the category along with other note details
          createdAt: noteCreationDate,
          leetcodeLink: category === "LeetCode" ? leetcodeLink : "",
          status: "In Progress", // Default status for new notes
        };

        await addDoc(notesCollectionRef, newNote);

        // If the category is LeetCode, also add a calendar event
        if (category === "LeetCode") {
          const eventsCollectionRef = collection(
            db,
            "users",
            currentUser.email!,
            "events",
          );
          const newEvent = {
            title: `LeetCode Note: ${title}`,
            start: noteCreationDate,
            end: null, // Initially no end date
            category: "LeetCode",
            allDay: false,
            status: "In Progress",
          };

          await addDoc(eventsCollectionRef, newEvent);
        }

        navigate("/dashboard"); // Redirect back to the dashboard after creation
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleToggle = () => {
    setUseMonacoEditor(!useMonacoEditor); // Toggle between editors
  };

  return (
    <div className="p-6 max-w-site mx-auto container">
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
            <option value="LeetCode">LeetCode</option>
          </select>
        </div>

        {/* Show LeetCode link input only if LeetCode category is selected */}
        {category === "LeetCode" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              LeetCode Question Link
            </label>
            <input
              type="url"
              value={leetcodeLink}
              onChange={(e) => setLeetcodeLink(e.target.value)}
              placeholder="https://leetcode.com/problems/example-problem/"
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        )}

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
