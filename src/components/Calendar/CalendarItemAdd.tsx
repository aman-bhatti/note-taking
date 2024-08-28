import React, { useState, useEffect } from "react";
import moment from "moment";

interface CalendarItemFormProps {
  initialData: {
    id?: string;
    title: string;
    start: string;
    end: string;
    priority: string;
    status: string;
    category?: string; // Category field for event
    allDay?: boolean; // Add allDay field to initialData
  };
  onSave: (event: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const CalendarItemAdd: React.FC<CalendarItemFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    ...initialData,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: initialData.allDay ?? false, // Initialize with allDay from initialData if available
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
      allDay: initialData.allDay ?? false, // Use the allDay property from initialData, defaulting to false
    });
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      // Handle "All Day" checkbox
      const isChecked = e.target.checked;
      setFormData((prev) => {
        if (isChecked) {
          // Set start time to 12:00 AM and end time to 11:59 PM
          return {
            ...prev,
            allDay: true,
            startTime: "00:00",
            endTime: "23:59",
          };
        } else {
          // Reset to default times if unchecking "All Day"
          return {
            ...prev,
            allDay: false,
            startTime: "08:00", // Default start time
            endTime: "17:00", // Default end time
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let startDateTime;
    let endDateTime;

    if (formData.allDay) {
      // If it's an all-day event, set start to 12:00 AM and end to 11:59 PM on the same day
      startDateTime = moment(formData.startDate).startOf("day");
      endDateTime = moment(formData.startDate).endOf("day");
    } else {
      // Use the provided times for the event
      startDateTime = moment(`${formData.startDate} ${formData.startTime}`);
      endDateTime = moment(`${formData.endDate} ${formData.endTime}`);
    }

    onSave({
      ...formData,
      start: startDateTime.toDate(),
      end: endDateTime.toDate(),
      allDay: formData.allDay, // Ensure allDay property is set correctly
    });
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 1100 }} // Set a high z-index for the overlay
    >
      <div
        className="bg-white p-4 rounded-lg w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 mx-auto"
        style={{ zIndex: 1110, position: "relative" }} // Set a higher z-index for the modal content
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
          {!formData.allDay && (
            <>
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
            </>
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
              {/* Add more categories as needed */}
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
