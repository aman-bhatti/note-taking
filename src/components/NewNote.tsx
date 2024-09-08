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
import ToggleSwitch from "./toggle";
import ResizableImage from "../components/Resizeable/resizeableimage";

const extractImageUrls = (markdownContent: string) => {
  const imageUrls = [];
  const regex = /!\[.*?\]\((.*?)\)/g; // Regular expression to match markdown image syntax ![alt](url)
  let match;
  while ((match = regex.exec(markdownContent)) !== null) {
    imageUrls.push(match[1]); // Capture the image URL
  }
  return imageUrls;
};

const NewNote: React.FC = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(""); // State for category
  const [leetcodeLink, setLeetcodeLink] = useState(""); // State for LeetCode link
  const [useMonacoEditor, setUseMonacoEditor] = useState(false); // Default to Text Editor
  const navigate = useNavigate();
  const [imageSizes, setImageSizes] = useState<{
    [src: string]: { width: number; height: number };
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email!);
        const notesCollectionRef = collection(userDocRef, "notes");
        const noteCreationDate = new Date();

        // Extract current images from the content
        const currentImages = extractImageUrls(content);

        // Prepare the new note data
        const newNote: any = {
          title,
          content,
          category,
          createdAt: noteCreationDate,
          leetcodeLink: category === "LeetCode" ? leetcodeLink : "",
          status: "In Progress",
        };

        // Only add imageSizes if there are images in the content
        if (currentImages.length > 0) {
          newNote.imageSizes = imageSizes;
        }

        // Save the new note to Firestore
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
            title: `${title}`,
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

  const handleImageResize = (src: string, width: number, height: number) => {
    setImageSizes((prevSizes) => ({
      ...prevSizes,
      [src]: { width, height },
    }));
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
            components={{
              img: ({ node, ...props }) => {
                const src = props.src || ""; // Ensure src is defined
                const initialWidth = imageSizes[src]?.width || 300; // Load saved width
                const initialHeight = imageSizes[src]?.height || 200; // Load saved height

                return (
                  <ResizableImage
                    src={src}
                    alt={props.alt || ""}
                    initialWidth={initialWidth}
                    initialHeight={initialHeight}
                    onResizeComplete={(width, height) =>
                      handleImageResize(src, width, height)
                    }
                  />
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default NewNote;
