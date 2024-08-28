import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import classNames from "classnames"; // Utility for conditional classnames

interface Todo {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: string;
  linkedNoteId?: string;
  completed: boolean;
  createdAt: Date;
}

interface Note {
  id: string;
  title: string;
}

const Todo: React.FC = () => {
  const { currentUser } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]); // Store notes for linking
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [importance, setImportance] = useState("Medium");
  const [linkedNoteId, setLinkedNoteId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAddTodo, setShowAddTodo] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchTodos();
      fetchNotes();
    }
  }, [currentUser]);

  const fetchTodos = async () => {
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.email!);
      const todosCollectionRef = collection(userDocRef, "todos");
      const querySnapshot = await getDocs(todosCollectionRef);
      const todosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Todo[];
      setTodos(todosData);
    }
  };

  const fetchNotes = async () => {
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.email!);
      const notesCollectionRef = collection(userDocRef, "notes");
      const querySnapshot = await getDocs(notesCollectionRef);
      const notesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
      })) as Note[];
      setNotes(notesData);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for required fields
    if (!title.trim() || !description.trim()) {
      setError("Title and Description are required.");
      return;
    }

    setError(null); // Clear any existing errors

    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email!);
        const todosCollectionRef = collection(userDocRef, "todos");
        await addDoc(todosCollectionRef, {
          title,
          description,
          category,
          importance,
          linkedNoteId: linkedNoteId || null, // Make linkedNoteId optional
          completed: false, // Initialize as not completed
          createdAt: new Date(),
        });
        setShowAddTodo(false); // Hide the add todo form after submission
        setTitle(""); // Reset title
        setDescription(""); // Reset description
        setCategory("General"); // Reset category
        setImportance("Medium"); // Reset importance
        setLinkedNoteId(""); // Reset linked note
        fetchTodos(); // Refresh todos list
      }
    } catch (error) {
      console.error("Error adding todo:", error);
      setError("Failed to add todo. Please try again.");
    }
  };

  const toggleTodoCompletion = async (todoId: string, completed: boolean) => {
    try {
      if (currentUser) {
        // Optimistically update the UI
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo.id === todoId ? { ...todo, completed: !completed } : todo,
          ),
        );

        const userDocRef = doc(db, "users", currentUser.email!);
        const todoDocRef = doc(userDocRef, "todos", todoId);
        await updateDoc(todoDocRef, { completed: !completed });

        // Optionally fetch todos again to ensure state is in sync with Firestore
        fetchTodos(); // Refresh todos list after update
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      setError("Failed to update todo. Please try again.");
      // Revert optimistic update if there's an error
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoId ? { ...todo, completed } : todo,
        ),
      );
    }
  };

  return (
    <div className="p-6 max-w-site mx-auto container">
      <h1 className="text-3xl font-bold mb-4">Todos</h1>
      <button
        onClick={() => setShowAddTodo(!showAddTodo)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mb-4"
      >
        {showAddTodo ? "Cancel" : "Add Todo"}
      </button>

      {showAddTodo && (
        <form onSubmit={handleAddTodo} className="mb-6">
          {error && <div className="text-red-500 mb-4">{error}</div>}
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
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              rows={3}
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            >
              {/* Replace these with actual categories from your notes */}
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Importance
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Linked Note (Optional)
            </label>
            <select
              value={linkedNoteId}
              onChange={(e) => setLinkedNoteId(e.target.value)}
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Select a note (optional)</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Todo
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {todos.length > 0 ? (
          todos.map((todo) => (
            <li
              key={todo.id}
              className={classNames(
                "flex items-center p-2 rounded-lg transition-colors",
                {
                  "bg-red-100": todo.importance === "High",
                  "bg-yellow-100": todo.importance === "Medium",
                  "bg-green-100": todo.importance === "Low",
                },
              )}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodoCompletion(todo.id, todo.completed)}
                className="mr-2"
              />
              <Link
                to={`/todo/${todo.id}`}
                className={classNames("flex-grow", {
                  "line-through": todo.completed,
                })}
              >
                {todo.title}
              </Link>
              {todo.linkedNoteId && (
                <Link
                  to={`/note/${todo.linkedNoteId}`}
                  className="ml-4 text-blue-500 underline"
                >
                  View Note
                </Link>
              )}
            </li>
          ))
        ) : (
          <p className="text-gray-500">No todos found. Start by adding one!</p>
        )}
      </ul>
    </div>
  );
};

export default Todo;
