import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import {
  FaArrowDown,
  FaArrowUp,
  FaTrashAlt,
  FaEdit,
  FaPlus,
} from "react-icons/fa";
import { IoIosDocument } from "react-icons/io";

interface Todo {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: "High" | "Medium" | "Low";
  linkedNoteId?: string;
  completed: boolean;
  createdAt: Date;
  dueDate: Date | null;
  tasks: Task[];
  isOverdue?: boolean;
}

interface Task {
  id: string;
  title: string;
  importance: string;
  completed: boolean;
}

interface Note {
  id: string;
  title: string;
}

const Todo: React.FC = () => {
  const { currentUser } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [importance, setImportance] = useState<"High" | "Medium" | "Low">(
    "Medium",
  );
  const [linkedNoteId, setLinkedNoteId] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [showAddTodo, setShowAddTodo] = useState(false);

  // State changes for expanded todos and editing contexts
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [editingContext, setEditingContext] = useState<Set<string>>(new Set());

  const [filterType, setFilterType] = useState<
    "High" | "Medium" | "Low" | "All"
  >("All");
  const [sortCategory, setSortCategory] = useState<
    "Due Date" | "Importance" | "Created"
  >("Importance");
  const [searchQuery, setSearchQuery] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editImportance, setEditImportance] = useState<
    "High" | "Medium" | "Low"
  >("Medium");
  const [editDueDate, setEditDueDate] = useState<Date | null>(new Date());
  const [editLinkedNoteId, setEditLinkedNoteId] = useState("");

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
      const todosData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: new Date(data.createdAt), // Ensure it's a Date object
          dueDate: data.dueDate ? new Date(data.dueDate) : null, // Ensure it's a Date object
          tasks: data.tasks || [],
        };
      }) as Todo[];
      setTodos(todosData);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long", // Full month name (e.g., "September")
      day: "numeric", // Day of the month (e.g., "3")
      year: "numeric", // Full year (e.g., "2024")
    });
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

    if (!title.trim() || !description.trim()) {
      setError("Title and Description are required.");
      return;
    }

    setError(null);

    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email!);
        const todosCollectionRef = collection(userDocRef, "todos");
        await addDoc(todosCollectionRef, {
          title,
          description,
          category,
          importance,
          linkedNoteId: linkedNoteId || null,
          completed: false,
          createdAt: new Date(),
          dueDate: dueDate ? dueDate.toISOString() : null,
          tasks: [],
        });
        setShowAddTodo(false);
        setTitle("");
        setDescription("");
        setCategory("General");
        setImportance("Medium");
        setLinkedNoteId("");
        setDueDate(new Date());
        fetchTodos();
      }
    } catch (error) {
      console.error("Error adding todo:", error);
      setError("Failed to add todo. Please try again.");
    }
  };

  const toggleTodoCompletion = async (todoId: string, completed: boolean) => {
    try {
      if (currentUser) {
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo.id === todoId ? { ...todo, completed: !completed } : todo,
          ),
        );

        const userDocRef = doc(db, "users", currentUser.email!);
        const todoDocRef = doc(userDocRef, "todos", todoId);
        await updateDoc(todoDocRef, { completed: !completed });

        fetchTodos();
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      setError("Failed to update todo. Please try again.");
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoId ? { ...todo, completed } : todo,
        ),
      );
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.email!);
        const todoDocRef = doc(userDocRef, "todos", todoId);
        await deleteDoc(todoDocRef);
        fetchTodos();
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      setError("Failed to delete todo. Please try again.");
    }
  };

  const toggleExpandTodo = (todoId: string, context: string) => {
    const key = `${todoId}-${context}`;
    const newExpandedTodos = new Set(expandedTodos);
    if (newExpandedTodos.has(key)) {
      newExpandedTodos.delete(key);
    } else {
      newExpandedTodos.add(key);
    }
    setExpandedTodos(newExpandedTodos);
  };

  const startEditingTodo = (todo: Todo, context: string) => {
    const key = `${todo.id}-${context}`;
    setEditingContext((prev) => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditCategory(todo.category);
    setEditImportance(todo.importance);
    setEditDueDate(todo.dueDate);
    setEditLinkedNoteId(todo.linkedNoteId || "");
  };

  const cancelEditingTodo = (todoId: string, context: string) => {
    const key = `${todoId}-${context}`;
    setEditingContext((prev) => {
      const newContext = new Set(prev);
      newContext.delete(key);
      return newContext;
    });
  };

  const saveEditedTodo = async (todoId: string, context: string) => {
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.email!);
      const todoDocRef = doc(userDocRef, "todos", todoId);
      const updatedTodo = {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        importance: editImportance,
        dueDate: editDueDate ? editDueDate.toISOString() : null,
        linkedNoteId: editLinkedNoteId || null,
        completed: false,
        tasks: todos.find((todo) => todo.id === todoId)?.tasks || [],
      };
      await updateDoc(todoDocRef, updatedTodo);
      fetchTodos();

      // Remove the editing context for the current todo
      const key = `${todoId}-${context}`;
      setEditingContext((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key); // Remove the key from the set
        return newSet;
      });
    }
  };

  const getImportanceClasses = (importance: string) => {
    switch (importance) {
      case "High":
        return "bg-red-100 border-red-300";
      case "Medium":
        return "bg-yellow-100 border-yellow-300";
      case "Low":
        return "bg-green-100 border-green-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const filterAndSortTodos = () => {
    let filteredTodos = todos.filter((todo) => {
      if (filterType === "All") return true;
      return todo.importance === filterType;
    });

    // Search logic: filter todos by title based on searchQuery
    if (searchQuery) {
      filteredTodos = filteredTodos.filter((todo) =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort and filter overdue tasks
    const now = new Date();
    filteredTodos.forEach((todo) => {
      if (todo.dueDate && new Date(todo.dueDate) < now && !todo.completed) {
        todo.isOverdue = true;
      } else {
        todo.isOverdue = false;
      }
    });

    switch (sortCategory) {
      case "Due Date":
        filteredTodos.sort(
          (a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0),
        );
        break;
      case "Importance":
        filteredTodos.sort((a, b) => a.importance.localeCompare(b.importance));
        break;
      case "Created":
        filteredTodos.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        break;
      default:
        break;
    }

    return filteredTodos;
  };

  const renderTodoItem = (todo: Todo, context: string) => {
    const key = `${todo.id}-${context}`;

    // Function to get a lighter background color based on importance
    const getLighterImportanceClasses = (importance: string) => {
      switch (importance) {
        case "High":
          return "bg-red-50"; // Lighter shade for high importance
        case "Medium":
          return "bg-yellow-50"; // Lighter shade for medium importance
        case "Low":
          return "bg-green-50"; // Lighter shade for low importance
        default:
          return "bg-gray-50"; // Default lighter background
      }
    };

    return (
      <div
        key={todo.id}
        className={`p-4 ${getImportanceClasses(todo.importance)} border-l-4 rounded-lg mb-2 shadow-md ${
          todo.isOverdue ? "border-red-600 bg-red-100" : ""
        }`}
      >
        {editingContext.has(key) ? (
          <div className="flex flex-col space-y-4">
            {/* Title Input */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="p-2 border rounded-md w-full"
              placeholder="Edit title"
            />

            {/* Description Input */}
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="p-2 border rounded-md w-full"
              placeholder="Edit description"
              rows={3}
            ></textarea>

            {/* Category Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            {/* Importance Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Importance
              </label>
              <select
                value={editImportance}
                onChange={(e) =>
                  setEditImportance(e.target.value as "High" | "Medium" | "Low")
                }
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Due Date Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={
                  editDueDate ? editDueDate.toISOString().split("T")[0] : ""
                }
                onChange={(e) => setEditDueDate(new Date(e.target.value))}
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            {/* Linked Note Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Linked Note (Optional)
              </label>
              <select
                value={editLinkedNoteId}
                onChange={(e) => setEditLinkedNoteId(e.target.value)}
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

            {/* Save and Cancel Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => saveEditedTodo(todo.id, context)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => cancelEditingTodo(todo.id, context)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodoCompletion(todo.id, todo.completed)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mr-2 mb-2 md:mb-0"
              />
              <Link
                to={`/todo/${todo.id}`}
                className={`font-bold text-lg ${todo.completed ? "line-through text-gray-500" : "text-gray-800"} mb-2 md:mb-0 text-balance todo-name`}
              >
                {todo.title}
              </Link>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center">
              {todo.dueDate && (
                <span
                  className={`mr-2 ${todo.isOverdue ? "text-red-600" : "text-gray-600"}`}
                >
                  {todo.isOverdue
                    ? "Overdue!"
                    : `Due: ${formatDate(new Date(todo.dueDate))}`}
                </span>
              )}
              <button
                onClick={() => toggleExpandTodo(todo.id, context)}
                className="bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 mr-2 p-2 rounded-md transition-colors mb-2 md:mb-0"
              >
                {expandedTodos.has(key) ? (
                  <FaArrowUp size={16} />
                ) : (
                  <FaArrowDown size={16} />
                )}
              </button>
              <button
                onClick={() => startEditingTodo(todo, context)}
                className="bg-blue-200 text-blue-500 hover:bg-blue-300 hover:text-blue-700 mr-2 p-2 rounded-md transition-colors mb-2 md:mb-0"
              >
                <FaEdit size={16} />
              </button>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="bg-red-200 text-red-500 hover:bg-red-300 hover:text-red-700 p-2 rounded-md transition-colors"
              >
                <FaTrashAlt size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Expand the tasks when the dropdown is open */}
        {expandedTodos.has(key) && !editingContext.has(key) && (
          <div
            className={`mt-4 p-4 rounded-md ${getLighterImportanceClasses(todo.importance)}`}
          >
            {/* Lighter background container based on importance */}
            <p className="text-black">Description: </p>
            <p className="text-gray-700"> {todo.description}</p>
            <p className="text-black">Importance: {todo.importance}</p>
            {todo.tasks.length > 0 && (
              <div className="mt-2">
                <h4 className="font-semibold">Tasks:</h4>
                <ul className="list-disc list-inside">
                  {todo.tasks.map((task) => (
                    <li
                      key={task.id}
                      className={`p-4 todo-name rounded-md ${getImportanceClasses(task.importance)} ${
                        task.completed
                          ? "line-through text-gray-500"
                          : "text-gray-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        readOnly
                        className="mr-2"
                      />
                      {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {todo.linkedNoteId && (
              <div className="mt-3">
                <p className="text-black">View Connected Note:</p>{" "}
                {/* Text above the link */}
                <Link
                  to={`/note/${todo.linkedNoteId}`}
                  className=" text-blue-500 underline flex items-center" // Flex to align icon and title
                >
                  <IoIosDocument className="mr-2" />{" "}
                  {/* Margin-right for spacing */}
                  {notes.find((note) => note.id === todo.linkedNoteId)?.title ||
                    "Unknown Note"}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTodosByImportance = () => {
    const filteredTodos = filterAndSortTodos();
    const todosByImportance = filteredTodos.reduce(
      (acc: { high: Todo[]; medium: Todo[]; low: Todo[] }, todo) => {
        if (todo.importance === "High") acc.high.push(todo);
        else if (todo.importance === "Medium") acc.medium.push(todo);
        else if (todo.importance === "Low") acc.low.push(todo);
        return acc;
      },
      { high: [], medium: [], low: [] },
    );

    const getCategoryBackgroundClass = (importance: string) => {
      if (sortCategory === "Importance") {
        switch (importance) {
          case "High":
            return "bg-red-300"; // Slightly darker than bg-red-200
          case "Medium":
            return "bg-yellow-300"; // Slightly darker than bg-yellow-200
          case "Low":
            return "bg-green-300"; // Slightly darker than bg-green-200
          default:
            return "bg-gray-300"; // Fallback
        }
      }
      return ""; // No additional background class if not sorted by Importance
    };

    return (
      <>
        {["High", "Medium", "Low"].map((importance) => (
          <div
            key={importance}
            className={`p-4 ${getCategoryBackgroundClass(
              importance,
            )} rounded-lg mb-4 shadow-md`}
          >
            <h2 className="text-2xl font-semibold mb-2">
              {importance} Importance
            </h2>
            {(
              todosByImportance[
                importance.toLowerCase() as "high" | "medium" | "low"
              ] || []
            ).map((todo) => renderTodoItem(todo, importance))}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="p-6 max-w-site mx-auto container md:max-w-5x1 lg:max-w-5x1 xl:max-w-5x1">
      <h1 className="text-3xl font-bold mb-4 truncate-text break-words">
        Todos
      </h1>

      {/* Integrated Add Todo Box */}
      <div
        onClick={() => setShowAddTodo(!showAddTodo)}
        className={`p-6 bg-gray-100 rounded-lg mb-4 shadow-md cursor-pointer ${showAddTodo ? "bg-gray-100" : ""}`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-black">Add Todo</h2>
          {showAddTodo ? (
            <FaArrowUp className="text-black" />
          ) : (
            <FaArrowDown className="text-black" />
          )}
        </div>
        {showAddTodo && (
          <form
            onSubmit={handleAddTodo}
            className="mt-4"
            onClick={(e) => e.stopPropagation()} // Add this line to stop propagation
          >
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
                onChange={(e) =>
                  setImportance(e.target.value as "High" | "Medium" | "Low")
                }
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate ? dueDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setDueDate(new Date(e.target.value))}
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
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
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full"
            >
              Add Todo
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-5 bg-blue-200 rounded-lg mb-4 shadow-md">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">
            Due Today
          </h2>
          {filterAndSortTodos()
            .filter(
              (todo) =>
                todo.dueDate &&
                todo.dueDate.toDateString() === new Date().toDateString(),
            )
            .map((todo) => renderTodoItem(todo, "Due Today"))}
        </div>

        <div className="mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(
                    e.target.value as "High" | "Medium" | "Low" | "All",
                  )
                }
                className="p-2 border rounded w-full md:w-auto"
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <span className="text-gray-700">Sort by:</span>
                <select
                  value={sortCategory}
                  onChange={(e) =>
                    setSortCategory(
                      e.target.value as "Due Date" | "Importance" | "Created",
                    )
                  }
                  className="p-2 border rounded w-full md:w-auto"
                >
                  <option value="Due Date">Due Date</option>
                  <option value="Importance">Importance</option>
                  <option value="Created">Created</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search by title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border rounded w-full md:w-1/2 mt-2 md:mt-0"
            />
          </div>

          {sortCategory === "Importance"
            ? renderTodosByImportance()
            : filterAndSortTodos().map((todo) =>
                renderTodoItem(todo, sortCategory),
              )}
        </div>
      </div>
    </div>
  );
};

export default Todo;
