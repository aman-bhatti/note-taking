import React, { useState, useEffect } from "react";
import moment from "moment";
import { useAuth } from "../../auth/AuthContext";
import { db } from "../../firebase";
import {
  updateDoc,
  setDoc,
  getDocs,
  query,
  where,
  doc,
  addDoc,
  collection,
} from "firebase/firestore";

interface CalendarItemFormProps {
  initialData: {
    id?: string;
    title: string;
    start: string;
    end: string;
    priority: string;
    status: string;
    category?: string;
    allDay?: boolean;
  };
  onSave: (event: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end?: Date | null; // Allow end to be null or undefined
  priority: string;
  status: string;
  category?: string;
  allDay?: boolean;
}

const CalendarItemAdd: React.FC<CalendarItemFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    ...initialData,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: initialData.allDay ?? false,
  });

  useEffect(() => {
    const startMoment = moment(initialData.start);
    const endMoment = moment(initialData.end);

    setFormData({
      ...initialData,
      startDate: startMoment.format("YYYY-MM-DD"),
      startTime: startMoment.format("HH:mm"),
      endDate: endMoment.format("YYYY-MM-DD"),
      endTime: endMoment.format("HH:mm"),
      allDay: initialData.allDay ?? false,
    });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      const isChecked = e.target.checked;
      setFormData((prev) => {
        if (isChecked) {
          return {
            ...prev,
            allDay: true,
            startTime: "00:00",
            endTime: "23:59",
          };
        } else {
          return {
            ...prev,
            allDay: false,
            startTime: "08:00",
            endTime: "17:00",
          };
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let startDateTime = moment(`${formData.startDate} ${formData.startTime}`);
    let endDateTime: Date | undefined;

    if (formData.category === "LeetCode") {
      endDateTime = undefined;
    } else if (formData.allDay) {
      startDateTime = moment(formData.startDate).startOf("day");
      endDateTime = moment(formData.startDate).endOf("day").toDate();
    } else {
      endDateTime = moment(`${formData.endDate} ${formData.endTime}`).toDate();
    }

    const event: CalendarEvent = {
      title: formData.title,
      start: startDateTime.toDate(),
      end: endDateTime,
      priority: formData.priority,
      status: formData.status,
      category: formData.category,
      allDay: formData.allDay,
    };

    if (formData.category === "LeetCode" && currentUser) {
      const userDocRef = doc(db, "users", currentUser.email!);
      const notesCollectionRef = collection(userDocRef, "notes");

      if (isEdit && initialData.id) {
        // If this is an edit, find the existing note and update it
        const noteQuery = query(
          notesCollectionRef,
          where("title", "==", initialData.title),
        );
        const querySnapshot = await getDocs(noteQuery);
        const noteToUpdate = querySnapshot.docs[0]; // Assuming there is one note per event

        if (noteToUpdate) {
          const noteDocRef = doc(notesCollectionRef, noteToUpdate.id);
          await updateDoc(noteDocRef, {
            title: formData.title,
            updatedAt: new Date(),
          });
        }
      } else {
        // If this is a new event, create a new note
        await addDoc(notesCollectionRef, {
          title: formData.title,
          category: "LeetCode",
          createdAt: new Date(),
          status: "In Progress",
          leetcodeLink: "",
        });
      }
    }

    onSave(event);
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 1100 }}
    >
      <div
        className="bg-white p-4 rounded-lg w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 mx-auto"
        style={{ zIndex: 1110, position: "relative" }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            {isEdit ? "Edit Calendar Event" : "Add Calendar Event"}
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-0 border-solid border-gray-400 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="allDay"
                checked={formData.allDay}
                onChange={handleChange}
                className="mr-2"
              />
              All Day Event
            </label>
          </div>
          <div className="mb-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          {/* Conditionally render the end date and time inputs */}
          {formData.category !== "LeetCode" && !formData.allDay && (
            <div className="mb-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}
          {formData.allDay && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            >
              <option value="General">General</option>
              <option value="Holiday">Holiday</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="LeetCode">LeetCode</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isEdit ? "Update Event" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarItemAdd;
