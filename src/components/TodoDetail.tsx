import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  FaTrashAlt,
  FaEdit,
  FaCalendarAlt,
  FaFlag,
  FaCheckCircle,
  FaStickyNote,
} from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";

interface Task {
  id: string;
  title: string;
  importance: string;
  completed: boolean;
}

const TodoDetail: React.FC = () => {
  const { currentUser } = useAuth();
  const { todoId } = useParams<{ todoId: string }>();
  const [todo, setTodo] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState(""); // Original title
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [originalDueDate, setOriginalDueDate] = useState<Date | null>(null); // Original due date
  const [importance, setImportance] = useState("Medium");
  const [originalImportance, setOriginalImportance] = useState("Medium"); // Original importance
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskImportance, setEditTaskImportance] = useState("Low");
  const [isEditingTodo, setIsEditingTodo] = useState(false); // State to handle editing of the todo
  const [linkedNoteTitle, setLinkedNoteTitle] = useState<string | null>(null); // State for linked note title
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
          setOriginalTitle(todoData.title); // Store original title
          if (todoData.dueDate) {
            const localDueDate = new Date(todoData.dueDate);
            setDueDate(localDueDate);
            setOriginalDueDate(localDueDate); // Store original due date
          } else {
            setDueDate(null);
            setOriginalDueDate(null);
          }

          setImportance(todoData.importance);
          setOriginalImportance(todoData.importance); // Store original importance
          setTasks(todoData.tasks || []);

          // Fetch linked note title if linkedNoteId exists
          if (todoData.linkedNoteId) {
            const noteDocRef = doc(
              db,
              "users",
              currentUser.email!,
              "notes",
              todoData.linkedNoteId,
            );
            const noteSnapshot = await getDoc(noteDocRef);
            if (noteSnapshot.exists()) {
              setLinkedNoteTitle(noteSnapshot.data().title);
            }
          }
        }
      }
    };

    fetchTodo();
  }, [currentUser, todoId]);

  const handleBackToAllTodos = () => {
    navigate("/todos");
  };

  const handleUpdate = async () => {
    if (currentUser && todoId) {
      const todoDocRef = doc(db, "users", currentUser.email!, "todos", todoId);
      const updatedTodo = {
        title,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        importance,
        tasks: todo.tasks, // Keep tasks unchanged during update
      };
      await updateDoc(todoDocRef, updatedTodo);
      setTodo((prev: any) => ({
        ...prev,
        ...updatedTodo,
      }));
      setOriginalTitle(title); // Update the original title after successful update
      setOriginalDueDate(dueDate); // Update the original due date
      setOriginalImportance(importance); // Update the original importance
      setIsEditingTodo(false); // Exit editing mode after update
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
        navigate("/todos");
      }
    }
  };

  // Function to cancel editing
  const cancelEditingTodo = () => {
    setTitle(originalTitle); // Reset the title to its original value
    setDueDate(originalDueDate); // Reset the due date to its original value
    setImportance(originalImportance); // Reset the importance to its original value
    setIsEditingTodo(false); // Exit editing mode
  };

  const addTask = () => {
    if (newTask.trim()) {
      const newTaskObj: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTask,
        importance: "Low", // Default importance to "Low"
        completed: false,
      };
      const updatedTasks = [...tasks, newTaskObj];
      setTasks(updatedTasks);
      setNewTask("");

      // Save tasks to Firestore
      if (currentUser && todoId) {
        const todoDocRef = doc(
          db,
          "users",
          currentUser.email!,
          "todos",
          todoId,
        );
        updateDoc(todoDocRef, { tasks: updatedTasks });
      }
    }
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);

    // Save tasks to Firestore
    if (currentUser && todoId) {
      const todoDocRef = doc(db, "users", currentUser.email!, "todos", todoId);
      updateDoc(todoDocRef, { tasks: updatedTasks });
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );
    setTasks(updatedTasks);

    // Save tasks to Firestore
    if (currentUser && todoId) {
      const todoDocRef = doc(db, "users", currentUser.email!, "todos", todoId);
      updateDoc(todoDocRef, { tasks: updatedTasks });
    }
  };

  const startEditingTask = (task: Task) => {
    setEditTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskImportance(task.importance);
  };

  const cancelEditingTask = () => {
    setEditTaskId(null);
    setEditTaskTitle("");
    setEditTaskImportance("Low");
  };

  const saveEditedTask = () => {
    const updatedTasks = tasks.map((task) =>
      task.id === editTaskId
        ? { ...task, title: editTaskTitle, importance: editTaskImportance }
        : task,
    );
    setTasks(updatedTasks);
    cancelEditingTask();

    // Save tasks to Firestore
    if (currentUser && todoId) {
      const todoDocRef = doc(db, "users", currentUser.email!, "todos", todoId);
      updateDoc(todoDocRef, { tasks: updatedTasks });
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

  return (
    <div className="p-6 max-w-site mx-auto container">
      <button
        onClick={handleBackToAllTodos}
        className="text-blue-500 hover:underline rounded mb-4"
      >
        ← Back to Todos
      </button>
      {todo ? (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            {isEditingTodo ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-3xl font-bold p-2 border rounded-md flex-grow"
              />
            ) : (
              <h1 className="text-3xl font-bold">{title}</h1>
            )}
            <div>
              <button
                onClick={() =>
                  isEditingTodo ? cancelEditingTodo() : setIsEditingTodo(true)
                }
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors mr-2"
              >
                {isEditingTodo ? "Cancel" : "Edit"}
              </button>
              {isEditingTodo ? (
                <button
                  onClick={handleUpdate}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mr-2"
                >
                  Update
                </button>
              ) : null}
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mb-4 flex items-center">
            <FaCalendarAlt className="text-gray-600 mr-2" />
            <span className="font-semibold mr-1">Due Date:</span>{" "}
            {isEditingTodo ? (
              <input
                type="date"
                value={dueDate ? dueDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setDueDate(new Date(e.target.value))}
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : dueDate ? (
              dueDate.toLocaleDateString()
            ) : (
              "No due date set"
            )}
          </div>
          <div className="mb-4 flex items-center">
            <FaFlag className="text-gray-600 mr-2" />
            <span className="font-semibold mr-1">Importance:</span>{" "}
            {isEditingTodo ? (
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            ) : (
              importance
            )}
          </div>
          <div className="mb-4 flex items-center">
            <FaCheckCircle className="text-gray-600 mr-2" />
            <span className="font-semibold mr-1">Completed:</span>{" "}
            {todo.completed ? "Yes" : "No"}
          </div>

          {linkedNoteTitle && (
            <div className="mb-4 flex items-center">
              <FaStickyNote className="text-gray-600 mr-2" />
              <span className="font-semibold mr-1">Linked Note:</span>{" "}
              <Link
                to={`/note/${todo.linkedNoteId}`}
                className="text-blue-500 hover:underline"
              >
                {linkedNoteTitle}
              </Link>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-xl font-semibold">Tasks:</h2>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 my-2 border-l-4 ${getImportanceClasses(
                  task.importance,
                )} rounded-lg shadow-sm`}
              >
                <div className="flex items-center w-full">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id)}
                    className="mr-2"
                  />
                  {editTaskId === task.id ? (
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        className="p-2 border rounded w-1/2 mr-2"
                      />
                      <select
                        value={editTaskImportance}
                        onChange={(e) => setEditTaskImportance(e.target.value)}
                        className="p-2 border rounded w-1/2"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <button
                        onClick={saveEditedTask}
                        className="text-green-500 hover:text-green-700 mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingTask}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`font-bold text-lg ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}
                    >
                      {task.title}
                    </span>
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={() => startEditingTask(task)}
                      className="bg-blue-200 text-blue-500 hover:bg-blue-300 hover:text-blue-700 mr-2 p-3 rounded-md transition-colors"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="bg-red-200 text-red-500 hover:bg-red-300 hover:text-red-700 p-3 rounded-md transition-colors"
                    >
                      <FaTrashAlt size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-5 font-bold text-xl">Add task</div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="New task"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addTask();
                  }
                }}
                className="p-2 border rounded w-11/12"
              />

              <button
                onClick={addTask}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors ml-2"
              >
                <FaPlus />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default TodoDetail;
