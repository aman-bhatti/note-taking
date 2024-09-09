import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import MonacoEditor from "@monaco-editor/react";
import ToggleSwitch from "./toggle";
import ResizableImage from "./Resizeable/resizeableimage";

const EditNote: React.FC = () => {
  const { currentUser } = useAuth();
  const { noteId } = useParams<{ noteId: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [imageSizes, setImageSizes] = useState<{
    [src: string]: { width: number; height: number };
  }>({});
  const [initialImages, setInitialImages] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [useMonacoEditor, setUseMonacoEditor] = useState(false);
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
          setImageSizes(noteData.imageSizes || {});
          setInitialImages(Object.keys(noteData.imageSizes || {})); // Store initial images
          setIsLocked(noteData.locked || false);
        } else {
          console.error("No such note!");
        }
      }
    };

    fetchNote();
  }, [currentUser, noteId]);

  // Helper function to extract all image URLs from markdown content
  const extractImageUrls = (markdownContent: string) => {
    const imageUrls = [];
    const regex = /!\[.*?\]\((.*?)\)/g;
    let match;
    while ((match = regex.exec(markdownContent)) !== null) {
      imageUrls.push(match[1]);
    }
    return imageUrls;
  };

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

        // Extract current images from the content
        const currentImages = extractImageUrls(content);

        // Compare initialImages with currentImages to detect removed images
        const removedImages = initialImages.filter(
          (img) => !currentImages.includes(img),
        );

        // Remove image sizes for any deleted images
        const updatedImageSizes = { ...imageSizes };
        removedImages.forEach((img) => {
          delete updatedImageSizes[img];
        });

        // Update the note in Firestore, removing any deleted image sizes
        await updateDoc(noteDocRef, {
          title,
          content,
          category,
          imageSizes: updatedImageSizes, // Update image sizes, removing deleted ones
          updatedAt: new Date(),
          locked: isLocked,
        });

        // Redirect back to the dashboard after updating
        navigate(`/note/${noteId}`);
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleImageResize = (src: string, width: number, height: number) => {
    setImageSizes((prevSizes) => ({
      ...prevSizes,
      [src]: { width, height },
    }));
  };

  const handleCancel = () => {
    navigate(`/note/${noteId}`);
  };

  const handleToggle = () => {
    setUseMonacoEditor(!useMonacoEditor);
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
            <option value="LeetCode">LeetCode</option>
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
                options={{ selectOnLineNumbers: true }}
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
        {/* Lock/Unlock Note */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Lock this note
          </label>
          <input
            type="checkbox"
            checked={isLocked}
            onChange={() => setIsLocked(!isLocked)}
            className="mr-2 leading-tight"
          />
          <span>
            {isLocked ? "This note is locked" : "This note is unlocked"}
          </span>
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
                const width = imageSizes[src]?.width || 300;
                const height = imageSizes[src]?.height || 200;

                return (
                  <ResizableImage
                    src={src}
                    alt={props.alt || ""}
                    initialWidth={width}
                    initialHeight={height}
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

export default EditNote;
