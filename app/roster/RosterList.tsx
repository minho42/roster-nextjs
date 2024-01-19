"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { useState, useEffect, useRef, useContext, useCallback } from "react"
import { UserContext } from "../UserContext"
import { getColorForTitle } from "../utils"
import { db } from "@/app/firebase"
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  onSnapshot,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
} from "firebase/firestore"
import { ShiftList, Shift } from "../components/ShiftList"
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline"

function renderDayHeaderContent(args) {
  const myDayNames = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]
  return myDayNames[args.date.getDay()]
}

export default function RosterList() {
  const calendarRef = useRef()
  const popupRef = useRef()
  const { user, setUser } = useContext(UserContext)
  const [titles, setTitles] = useState({})
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [events, setEvents] = useState([])
  const [refetchTogle, setRefchToggle] = useState(false)
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  async function createRoster(uid, start, shiftId) {
    console.log("createRoster")
    // Create roster using relashipship of shift
    // const docRef = doc(collection(db, `roster/${uid}/shift/`))
    // await setDoc(docRef, {
    //   start,
    //   shift: doc(collection(db, `shifts/${uid}/shift`), shiftId),
    // })

    // check for duplicate
    const rosterColRef = collection(db, `roster/${uid}/shift/`)
    const querySnapshot = await getDocs(rosterColRef)

    const duplicate = querySnapshot.docs.find((doc) => {
      return doc.data().shift.id === shiftId && doc.data().start === start
    })
    if (duplicate) {
      console.log("Not created: duplicate title")
    } else {
      const docRef = doc(rosterColRef)
      await setDoc(docRef, {
        start,
        shift: doc(collection(db, `shifts/${uid}/shift`), shiftId),
      })
    }

    // Create roster by copying shift data, not using relationship
    // const shiftDocRef = doc(db, `shifts/${uid}/shift`, shiftId)
    // const shiftDocSnapshot = await getDoc(shiftDocRef)
    // if (shiftDocSnapshot.exists()) {
    //   const shiftData = shiftDocSnapshot.data()
    //   const rosterDocRef = doc(collection(db, `roster/${uid}/shift/`))
    //   await setDoc(rosterDocRef, {
    //     start,
    //     title: shiftData?.title,
    //   })
    // }
  }

  async function handleDateClick(info) {
    console.log("handleDateClick")
    console.log("dateClick", info.dateStr)
    if (!user || !selectedShift) return

    // optimistically create first
    const calApi = calendarRef.current.getApi()
    calApi.addEvent({
      id: user.uid,
      title: "...",
      start: info.dateStr,
      backgroundColor: selectedShift ? getColorForTitle(selectedShift?.title) : "#fff",
      textColor: "#000",
    })

    if (selectedShift) {
      await createRoster(user.uid, info.dateStr, selectedShift?.id)
    }
    setRefchToggle(!refetchTogle)
  }

  async function getShiftTitle(shiftId) {
    // console.log("getShiftTitle")
    // if (titles[shiftId]) {
    //   console.log(`titles[${shiftId}]: ${titles[shiftId]} exist`)
    // }

    const docRef = doc(db, `shifts/${user.uid}/shift`, shiftId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists) {
      // console.log(docSnap.data())
      // setTitles((prevTitles) => ({ ...prevTitles, [shiftId]: title }))
      const title = docSnap.data()?.title
      return title
    } else {
      console.log("No shift for id: " + shiftId)
      return null
    }
  }

  async function getRosterList() {
    console.log("getRosterList")
    if (!user) {
      return setEvents([])
    }
    const colRef = collection(db, `roster/${user.uid}/shift`)
    const snapshot = await getDocs(colRef)

    const temp = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const shiftId = doc.data().shift.id
        const title = await getShiftTitle(shiftId)
        // const title = doc.data().title
        const start = doc.data().start
        const color = getColorForTitle(title)
        return {
          start,
          title,
          color,
        }
      })
    )
    // console.log(temp)
    const excludeUndefinedEvents = temp.filter((event) => event.title)
    console.log(excludeUndefinedEvents)
    setEvents(excludeUndefinedEvents)
  }

  function keyboardShortcuts(e) {
    if (!isPopupVisible) return

    // esc to close popup
    if (e.keyCode === 27) {
      handlePopupClose()
    }
  }

  function handlePopupClose() {
    setIsPopupVisible(false)
    setSelectedEvent(null)
  }

  useEffect(() => {
    getRosterList()

    const calApi = calendarRef.current.getApi()
    console.log("calApi.render")
    calApi.render()
  }, [user, refetchTogle])

  useEffect(() => {
    document.addEventListener("keydown", keyboardShortcuts)
    return () => {
      document.removeEventListener("keydown", keyboardShortcuts)
    }
  }, [isPopupVisible])

  function handleEventClick(info) {
    console.log(info.event.start)
    const startStr = info.event.start.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    setIsPopupVisible(true)
    console.log("eventClick", info.event.title)
    setSelectedEvent(info)
    popupRef.current.querySelector(
      "#deleteOption"
    ).textContent = `Delete: [${info.event.title}] (${startStr})`
  }

  function handleDelete() {
    console.log("handleDelete")

    setIsPopupVisible(false)
  }

  return (
    <div className="flex flex-col justify-center items-center pb-10 gap-3">
      {isEditMode && <ShiftList header={false} setSelectedForParent={setSelectedShift} size={"small"} />}

      <div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`absolute top-1 right-1 !rounded-full w-12 h-12 text-3xl ${
            isEditMode ? "btn-red" : "btn-blue"
          }`}
        >
          <div className="flex items-center justify-center w-full h-full">
            {isEditMode ? <XMarkIcon className="w-10 h-10" /> : <PlusIcon className="w-10 h-10" />}
          </div>
        </button>
      </div>

      <div
        id="overlay"
        onClick={handlePopupClose}
        className={`absolute inset-0  min-h-screen w-screen bg-black opacity-0 z-40
        ${isPopupVisible ? "inline-block" : "hidden"}
        `}
      ></div>
      <div
        ref={popupRef}
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-black rounded-md z-50 ${
          isPopupVisible ? "inline-block" : "hidden"
        }`}
      >
        <div
          className="
           z-10 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <div className="py-1 text-center" role="none">
            {/* Active: "bg-gray-100 text-gray-900", Not Active: "text-gray-700" */}
            <a
              href="#"
              className="block px-4 py-2 text-sm hover:bg-neutral-200"
              role="menuitem"
              tabIndex={-1}
            >
              Nothing...
            </a>
            <a
              id="deleteOption"
              onClick={handleDelete}
              href="#"
              className="block px-4 py-2 text-sm hover:bg-neutral-200"
              tabIndex={-1}
            >
              Delete
            </a>
          </div>
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        fixedWeekCount={false}
        displayEventTime={false}
        locale="en-au"
        height="400"
        contentHeight="auto"
        firstDay={1} // Sunday=0, Monday=1,
        dayHeaderContent={renderDayHeaderContent}
        titleFormat={{
          year: "numeric",
          month: "short",
        }}
        buttonText={{
          today: "Today",
        }}
        headerToolbar={{
          left: "title",
          center: "",
          right: "today,prev,next",
        }}
        events={events}
        eventClick={handleEventClick}
        eventOrder={"start,-duration,allDay,title"}
        eventOrderStrict={false}
        eventDisplay="block"
        eventTextColor="#000"
        selectable={true}
        dateClick={handleDateClick}
      />
    </div>
  )
}
