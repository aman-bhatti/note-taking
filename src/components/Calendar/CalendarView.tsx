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
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import CalendarItemAdd from "./CalendarItemAdd";
import "../../styles/calendar.css";

const localizer = momentLocalizer(moment);

const categoryColors: { [key: string]: string } = {
  General: "#2196f3",
  Holiday: "#ffcc00",
  Work: "#4caf50",
  Personal: "#ff5722",
  LeetCode: "#fda31c",
};

interface Event {
  id?: string;
  title: string;
  start: Date;
  end?: Date | null; // Allow end to be null or undefined
  priority?: string;
  status?: string;
  category?: string;
  allDay?: boolean;
}

const CalendarView: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [connectedNoteId, setConnectedNoteId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDimming, setIsDimming] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);

  const toggleForceUpdate = () => setForceUpdate(!forceUpdate);

  useEffect(() => {
    const combineEventsAndHolidays = async () => {
      const userEvents = await fetchUserEvents();
      const holidays = await fetchHolidays();
      setEvents([...userEvents, ...holidays]);
    };

    combineEventsAndHolidays();
  }, [currentUser, forceUpdate]);

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
        const fetchedEvents = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: data.start.toDate(),
            end: data.end ? data.end.toDate() : undefined,
            priority: data.priority,
            status: data.status,
            category: data.category || "General",
            allDay: data.allDay || false,
          } as Event;
        });
        return fetchedEvents;
      } catch (error) {
        console.error("Error fetching user events:", error);
        return [];
      }
    }
    return [];
  };

  const fetchHolidays = async () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    try {
      const responseCurrentYear = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/US`,
      );

      const responseNextYear = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${nextYear}/US`,
      );

      const combinedHolidays = [
        ...responseCurrentYear.data,
        ...responseNextYear.data,
      ];

      const mainHolidays = [
        "New Year's Day",
        "New Year's Eve",
        "Martin Luther King Jr. Day",
        "Presidents' Day",
        "Memorial Day",
        "Independence Day",
        "Labour Day",
        "Columbus Day",
        "Veterans Day",
        "Thanksgiving Day",
        "Christmas Day",
      ];

      const uniqueHolidays: { [key: string]: boolean } = {};

      const holidays = combinedHolidays
        .filter((holiday: any) => mainHolidays.includes(holiday.localName))
        .filter((holiday: any) => {
          const holidayKey = `${holiday.localName}-${holiday.date}`;
          if (uniqueHolidays[holidayKey]) {
            return false;
          }
          uniqueHolidays[holidayKey] = true;
          return true;
        })
        .map((holiday: any) => {
          const start = moment(holiday.date).startOf("day").toDate();
          const end = moment(holiday.date).endOf("day").toDate();
          return {
            title: holiday.localName,
            start,
            end,
            category: "Holiday",
            allDay: true,
          };
        });

      // Manually add Halloween and other custom holidays
      const customHolidays = [
        {
          title: "Halloween",
          start: moment(`${currentYear}-10-31`).startOf("day").toDate(),
          end: moment(`${currentYear}-10-31`).endOf("day").toDate(),
          category: "Holiday",
          allDay: true,
        },
        {
          title: "Halloween",
          start: moment(`${nextYear}-10-31`).startOf("day").toDate(),
          end: moment(`${nextYear}-10-31`).endOf("day").toDate(),
          category: "Holiday",
          allDay: true,
        },
        // Add more custom holidays here if needed
      ];

      return [...holidays, ...customHolidays];
    } catch (error) {
      console.error("Error fetching holidays:", error);
      return [];
    }
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot({
      start: new Date(slotInfo.start),
      end: new Date(slotInfo.end),
    });
    setIsDimming(true);
    toggleForceUpdate();
    setShowAddEventModal(true);
  };

  const handleSelectEvent = async (
    event: Event,
    e: React.SyntheticEvent<HTMLElement>,
  ) => {
    setSelectedEvent(event);
    setShowEventPopup(true);
    setShowEditEventModal(false);
    const mouseEvent = e.nativeEvent as MouseEvent;
    setMousePosition({ x: mouseEvent.clientX, y: mouseEvent.clientY });

    // If the event is a LeetCode event, fetch the corresponding note
    if (event.category === "LeetCode" && currentUser?.email) {
      const noteTitle = event.title.replace("", "");
      const notesCollectionRef = collection(
        db,
        "users",
        currentUser.email,
        "notes",
      );
      const notesQuery = query(
        notesCollectionRef,
        where("title", "==", noteTitle),
      );
      const notesSnapshot = await getDocs(notesQuery);

      if (!notesSnapshot.empty) {
        const noteDoc = notesSnapshot.docs[0];
        setConnectedNoteId(noteDoc.id);
      } else {
        setConnectedNoteId(null);
      }
    } else {
      setConnectedNoteId(null);
    }
  };

  const handleEditClick = () => {
    if (selectedEvent) {
      console.log("Editing event:", selectedEvent); // Debug: Log selected event details
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
    setConnectedNoteId(null);
    setIsDimming(false);
    toggleForceUpdate();
  };

  const handleSaveEvent = async (newEvent: Event) => {
    if (!currentUser) {
      console.error("No current user, cannot add or update event");
      return;
    }

    // Ensure consistent title format for LeetCode events
    const title =
      newEvent.category === "LeetCode" ? `${newEvent.title}` : newEvent.title;

    console.log("Saving event:", { ...newEvent, title });

    try {
      const eventToSave = {
        title: title, // Use normalized title
        start: newEvent.start,
        end: newEvent.end ?? null,
        priority: newEvent.priority || "Normal",
        status: newEvent.status || "Pending",
        category: newEvent.category || "General",
        allDay: newEvent.allDay || false,
      };

      const eventsCollectionRef = collection(
        db,
        "users",
        currentUser.email!,
        "events",
      );

      if (newEvent.id) {
        // Update existing event
        const eventDocRef = doc(eventsCollectionRef, newEvent.id);
        await updateDoc(eventDocRef, eventToSave);

        setEvents((prevEvents) => {
          const updatedEvents = prevEvents.map((evt) =>
            evt.id === newEvent.id
              ? { ...evt, ...eventToSave, id: newEvent.id }
              : evt,
          );
          return updatedEvents;
        });
      } else {
        // Add new event
        const docRef = await addDoc(eventsCollectionRef, eventToSave);
        const newEventWithId = { ...eventToSave, id: docRef.id };

        setEvents((prevEvents) => [...prevEvents, newEventWithId]);
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }

    handleCloseModal();
  };

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
        endAccessor={(event: Event) => event.end || event.start}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        style={{ height: "75vh" }}
        views={[Views.DAY, Views.WEEK, Views.MONTH]}
        step={30}
        timeslots={1}
        defaultView={Views.WEEK}
        min={new Date(1970, 1, 1, 8, 0, 0)}
        max={new Date(1970, 1, 1, 23, 0, 0)}
        eventPropGetter={eventPropGetter}
        className="text-xs sm:text-sm"
      />

      {/* Add Event Modal */}
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

      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <CalendarItemAdd
          initialData={{
            id: selectedEvent.id, // Ensure this is passed to maintain consistency
            title: selectedEvent.title,
            start: selectedEvent.start.toISOString(),
            end: selectedEvent.end ? selectedEvent.end.toISOString() : "",
            priority: selectedEvent.priority || "Normal",
            status: selectedEvent.status || "Pending",
            category: selectedEvent.category || "General",
            allDay: selectedEvent.allDay || false,
          }}
          onSave={(event) => {
            if (selectedEvent?.id) {
              // Retain the id for the edited event
              event.id = selectedEvent.id;
            }
            handleSaveEvent(event);
          }}
          onCancel={handleCloseModal}
          isEdit={true}
        />
      )}

      {/* Event Popup */}
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
            {selectedEvent.end
              ? moment(selectedEvent.end).format("MMMM Do YYYY, h:mm A")
              : "End time not set"}
          </p>
          {selectedEvent.category === "LeetCode" && connectedNoteId && (
            <p>
              <a
                href="#"
                onClick={() => navigate(`/note/${connectedNoteId}`)}
                className="text-blue-500 underline"
              >
                View connected note
              </a>
            </p>
          )}
          {selectedEvent.category !== "Holiday" && (
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
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
