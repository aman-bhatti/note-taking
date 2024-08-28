import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";

const TodoDetail: React.FC = () => {
  const { currentUser } = useAuth();
  const { todoId } = useParams<{ todoId: string }>();
  const [todo, setTodo] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false); // State to handle editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [importance, setImportance] = useState("Medium");
  const [linkedNoteId, setLinkedNoteId] = useState<string | undefined>();
  const [userNotes, setUserNotes] = useState<any[]>([]); // State to store the user's notes
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodo = async () => {
      if (currentUser && todoId) {
        const todoDocRef = doc(
          db,
          "users",
          currentUser.email!,
          "todos",
          todoId,
        );
        const todoSnapshot = await getDoc(todoDocRef);
        if (todoSnapshot.exists()) {
          const todoData = todoSnapshot.data();
          setTodo(todoData);
          setTitle(todoData.title);
          setDescription(todoData.description);
          setCategory(todoData.category);
          setImportance(todoData.importance);
          setLinkedNoteId(todoData.linkedNoteId);
        }
      }
    };

    const fetchUserNotes = async () => {
      if (currentUser) {
        const notesCollectionRef = collection(
          db,
          "users",
          currentUser.email!,
          "notes",
        );
        const notesSnapshot = await getDocs(notesCollectionRef);
        const notesData = notesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserNotes(notesData);
      }
    };

    fetchTodo();
    fetchUserNotes();
  }, [currentUser, todoId]);

  const handleBackToAllTodos = () => {
    navigate("/todos");
  };

  const handleUpdate = async () => {
    if (currentUser && todoId) {
      const todoDocRef = doc(db, "users", currentUser.email!, "todos", todoId);
      await updateDoc(todoDocRef, {
        title,
        description,
        category,
        importance,
        linkedNoteId,
      });
      setIsEditing(false); // Exit editing mode after update
      const updatedTodo = {
        title,
        description,
        category,
        importance,
        linkedNoteId,
      };
      setTodo(updatedTodo); // Update local state with new values
    }
  };

  const handleDelete = async () => {
    if (currentUser && todoId) {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this todo?",
      );
      if (confirmDelete) {
        const todoDocRef = doc(
          db,
          "users",
          currentUser.email!,
          "todos",
          todoId,
        );
        await deleteDoc(todoDocRef);
        navigate("/todos"); // Navigate back to the todos list page
      }
    }
  };

  return (
    <div className="p-6 max-w-site mx-auto container">
      <button
        onClick={handleBackToAllTodos}
        className="text-blue-500 hover:underline rounded mb-4"
      >
        ← Back to Todos
      </button>
      <h2 className="text-3xl font-bold mb-4">Todo Details</h2>
      {todo ? (
        <div>
          {isEditing ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Title:</h3>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Description:</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Category:</h3>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Other">Other</option>
                  {/* Add more categories as needed */}
                </select>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Importance:</h3>
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                  className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  Linked Note (Optional):
                </h3>
                <select
                  value={linkedNoteId}
                  onChange={(e) => setLinkedNoteId(e.target.value)}
                  className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">None</option>
                  {userNotes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title || note.content}{" "}
                      {/* Adjust based on your note data structure */}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleUpdate}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-2"
              >
                Update
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Title:</h3>
                <p className="mt-1">{todo.title}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Description:</h3>
                <p className="mt-1">{todo.description}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Category:</h3>
                <p className="mt-1">{todo.category}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Importance:</h3>
                <p className="mt-1">{todo.importance}</p>
              </div>
              {todo.linkedNoteId && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Linked Note:</h3>
                  <p className="mt-1">{todo.linkedNoteId}</p>
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg mr-2"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default TodoDetail;
