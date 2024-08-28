import axios from "axios";
import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, SlotInfo, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../../auth/AuthContext";
import CalendarItemAdd from "./CalendarItemAdd";

const localizer = momentLocalizer(moment);

const categoryColors: { [key: string]: string } = {
  General: "#2196f3",
  Holiday: "#ffcc00",
  Work: "#4caf50",
  Personal: "#ff5722",
};

interface Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  priority?: string;
  status?: string;
  category?: string;
  allDay?: boolean;
}

const CalendarView: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDimming, setIsDimming] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);

  const toggleForceUpdate = () => setForceUpdate(!forceUpdate);

  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    priority: "Normal",
    status: "Pending",
    category: "General",
    allDay: false,
  });

  const fetchUserEvents = async () => {
    if (currentUser) {
      const eventsCollectionRef = collection(
        db,
        "users",
        currentUser.email!,
        "events",
      );
      try {
        const querySnapshot = await getDocs(eventsCollectionRef);
        const fetchedEvents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          start: doc.data().start.toDate(),
          end: doc.data().end.toDate(),
          priority: doc.data().priority,
          status: doc.data().status,
          category: doc.data().category || "General",
          allDay: doc.data().allDay || false,
        })) as Event[];
        return fetchedEvents;
      } catch (error) {
        console.error("Error fetching user events:", error);
        return [];
      }
    }
    return [];
  };

  const fetchHolidays = async () => {
    const apiKey = process.env.REACT_APP_CALENDARIFIC_API_KEY;
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    try {
      // Fetch holidays for the current year
      const responseCurrentYear = await axios.get(
        "https://calendarific.com/api/v2/holidays",
        {
          params: {
            api_key: apiKey,
            country: "US",
            year: currentYear,
          },
        },
      );

      // Fetch holidays for the next year
      const responseNextYear = await axios.get(
        "https://calendarific.com/api/v2/holidays",
        {
          params: {
            api_key: apiKey,
            country: "US",
            year: nextYear,
          },
        },
      );

      // Combine holidays from both responses
      const combinedHolidays = [
        ...responseCurrentYear.data.response.holidays,
        ...responseNextYear.data.response.holidays,
      ];

      const mainHolidays = [
        "New Year's Day",
        "New Year's Eve",
        "Martin Luther King Jr. Day",
        "Presidents' Day",
        "Memorial Day",
        "Independence Day",
        "Labor Day",
        "Columbus Day",
        "Veterans Day",
        "Thanksgiving Day",
        "Christmas Day",
        "Halloween",
      ];

      const uniqueHolidays: { [key: string]: boolean } = {};

      const holidays = combinedHolidays
        .filter((holiday: any) => mainHolidays.includes(holiday.name))
        .filter((holiday: any) => {
          const holidayKey = `${holiday.name}-${holiday.date.iso}`;
          if (uniqueHolidays[holidayKey]) {
            return false;
          }
          uniqueHolidays[holidayKey] = true;
          return true;
        })
        .map((holiday: any) => {
          const start = moment(holiday.date.iso).startOf("day").toDate();
          const end = moment(holiday.date.iso).endOf("day").toDate();
          return {
            title: holiday.name,
            start,
            end,
            category: "Holiday",
            allDay: true,
          };
        });

      return holidays;
    } catch (error) {
      console.error("Error fetching holidays:", error);
      return [];
    }
  };
  useEffect(() => {
    const combineEventsAndHolidays = async () => {
      const userEvents = await fetchUserEvents();
      const holidays = await fetchHolidays();
      setEvents([...userEvents, ...holidays]);
    };

    combineEventsAndHolidays();
  }, [currentUser, forceUpdate]);

  const eventPropGetter = (event: Event) => {
    const backgroundColor = categoryColors[event.category || "General"];
    const isDimmed =
      isDimming && (!selectedEvent || selectedEvent.id !== event.id);

    return {
      style: {
        backgroundColor,
        color: "white",
        opacity: isDimmed ? 0.5 : 1,
      },
    };
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const isAllDay =
      slotInfo.slots.length === 1 &&
      slotInfo.start.getHours() === 0 &&
      slotInfo.end.getHours() === 0;

    setSelectedSlot({
      start: new Date(slotInfo.start),
      end: new Date(slotInfo.end),
    });
    setIsDimming(true);
    toggleForceUpdate();
    setShowAddEventModal(true);
  };

  const handleSelectEvent = (
    event: Event,
    e: React.SyntheticEvent<HTMLElement>,
  ) => {
    setSelectedEvent(event);
    setShowEventPopup(true);
    setShowEditEventModal(false);
    const mouseEvent = e.nativeEvent as MouseEvent;
    setMousePosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });
  };

  const handleEditClick = () => {
    if (selectedEvent) {
      setShowEditEventModal(true);
      setShowEventPopup(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (currentUser && selectedEvent && selectedEvent.id) {
      try {
        const eventDocRef = doc(
          db,
          "users",
          currentUser.email!,
          "events",
          selectedEvent.id,
        );
        await deleteDoc(eventDocRef);
        setEvents(events.filter((evt) => evt.id !== selectedEvent.id));
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowAddEventModal(false);
    setShowEditEventModal(false);
    setShowEventPopup(false);
    setSelectedEvent(null);
    setIsDimming(false);
    toggleForceUpdate();
  };

  const handleSaveEvent = async (newEvent: Event) => {
    if (!currentUser) {
      console.error("No current user, cannot add or update event");
      return;
    }

    try {
      // Prepare the event object to only include necessary fields
      const eventToSave = {
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        priority: newEvent.priority || "Normal",
        status: newEvent.status || "Pending",
        category: newEvent.category || "General",
        allDay: newEvent.allDay || false,
      };

      if (newEvent.id) {
        // Update existing event
        const eventDocRef = doc(
          db,
          "users",
          currentUser.email!,
          "events",
          newEvent.id,
        );
        await updateDoc(eventDocRef, eventToSave);
        setEvents(
          events.map((evt) =>
            evt.id === newEvent.id ? { ...eventToSave, id: evt.id } : evt,
          ),
        );
      } else {
        // Add new event
        const eventsCollectionRef = collection(
          db,
          "users",
          currentUser.email!,
          "events",
        );
        const docRef = await addDoc(eventsCollectionRef, eventToSave);
        setEvents([...events, { ...eventToSave, id: docRef.id }]);
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }

    handleCloseModal();
  };

  return (
    <div className="p-4 sm:p-6 max-w-site mx-auto container">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Calendar View</h1>

      {/* Category Colors Legend */}
      <div className="flex space-x-4 mb-4">
        {Object.entries(categoryColors).map(([category, color]) => (
          <div key={category} className="flex items-center space-x-2">
            <span
              className="rounded w-4 h-4"
              style={{ backgroundColor: color }}
            ></span>
            <span className="text-1xl">{category}</span>
          </div>
        ))}
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        style={{ height: "75vh" }}
        views={[Views.DAY, Views.WEEK, Views.MONTH]}
        step={30}
        timeslots={1}
        defaultView={Views.MONTH}
        min={new Date(1970, 1, 1, 8, 0, 0)}
        max={new Date(1970, 1, 1, 23, 0, 0)}
        eventPropGetter={eventPropGetter}
        className="text-xs sm:text-sm"
      />
      {showAddEventModal && (
        <CalendarItemAdd
          initialData={{
            title: "",
            start: selectedSlot.start.toISOString(),
            end: selectedSlot.end.toISOString(),
            priority: "Normal",
            status: "Pending",
            category: "General",
            allDay: false,
          }}
          onSave={handleSaveEvent}
          onCancel={handleCloseModal}
        />
      )}
      {showEventPopup && selectedEvent && (
        <div
          className="absolute bg-white border rounded-lg shadow-lg p-4"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            transform: "translate(-50%, -50%)",
            zIndex: 1050,
          }}
        >
          <button
            onClick={handleCloseModal}
            className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
          <h2 className="text-lg font-bold">{selectedEvent.title}</h2>
          <p>
            {moment(selectedEvent.start).format("MMMM Do YYYY, h:mm A")} -{" "}
            {moment(selectedEvent.end).format("MMMM Do YYYY, h:mm A")}
          </p>
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleEditClick}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteEvent}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      {showEditEventModal && selectedEvent && (
        <CalendarItemAdd
          initialData={{
            id: selectedEvent.id,
            title: selectedEvent.title,
            start: selectedEvent.start.toISOString(),
            end: selectedEvent.end.toISOString(),
            priority: selectedEvent.priority || "Normal",
            status: selectedEvent.status || "Pending",
            category: selectedEvent.category || "General",
            allDay: selectedEvent.allDay || false,
          }}
          onSave={handleSaveEvent}
          onCancel={handleCloseModal}
          isEdit={true}
        />
      )}
    </div>
  );
};

export default CalendarView;
