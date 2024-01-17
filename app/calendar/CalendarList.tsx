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

function renderDayHeaderContent(args) {
  const myDayNames = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]
  return myDayNames[args.date.getDay()]
}
function handleEventClick(info) {
  console.log("eventClick", info.event.title)
}

export default function CalendarList() {
  function ShiftSelectList() {
    const [shiftList, setShiftList] = useState([])
    const inputRef = useRef()

    const getShiftList = async () => {
      console.log("getShiftList")
      if (!user) {
        return setShiftList([])
      }
      const colRef = collection(db, `shifts/${user.uid}/shift`)
      const q = query(colRef, orderBy("createdAt", "asc"))
      try {
        const snapshot = await getDocs(q)
        const temp = snapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id }
        })
        setShiftList(temp)
      } catch (error) {
        console.log(error)
      }
    }

    useEffect(() => {
      getShiftList()
    }, [])

    return (
      <div className="flex flex-col sm:max-w-lg w-full bg-purple-100 p-3">
        <h1 className="text-center">
          {!selectedShift ? "Select shift " : `Select date on calendar for \"${selectedShift?.title}\"`}
        </h1>
        <div className="flex flex-col gap-6">
          <div
            className="flex items-center justify-center gap-3 flex-wrap p-4 
            border border-neutral-300 rounded-lg bg-white"
          >
            {shiftList &&
              shiftList.length > 0 &&
              shiftList.map((shift) => (
                <div
                  onClick={() => {
                    setSelectedShift(shift)
                  }}
                  key={shift.id}
                  className={`flex space-y-1 group relative rounded-lg 
                 ${
                   shift.id === selectedShift?.id
                     ? "border-2 border-black shadow-lg text-xl"
                     : "border-2 border-white"
                 }`}
                >
                  <div
                    style={{ backgroundColor: getColorForTitle(shift.title) }}
                    className="flex items-center justify-center min-w-12 min-h-12 rounded-md p-2"
                  >
                    {shift.title}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  const calendarRef = useRef()
  const { user, setUser } = useContext(UserContext)
  const [titles, setTitles] = useState({})
  const [selectedShift, setSelectedShift] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const [events, setEvents] = useState([])
  const [refetchTogle, setRefchToggle] = useState(false)

  async function createRoster(uid, start, shiftId) {
    console.log("createRoster")
    const docRef = doc(collection(db, `roster/${uid}/shift/`))
    await setDoc(docRef, {
      start,
      shift: doc(collection(db, `shifts/${uid}/shift`), shiftId),
    })
  }

  async function handleDateClick(info) {
    console.log("handleDateClick")
    console.log("dateClick", info.dateStr)
    if (!user) return

    // optimistically create first
    const calApi = calendarRef.current.getApi()
    calApi.addEvent({
      id: user.uid,
      title: "...",
      // start: new Date(info.dateStr).toISOString(),
      start: info.dateStr,
      backgroundColor: "#fff",
      borderColor: "#fff",
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
      const title = docSnap.data().title
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

        const start = doc.data().start
        const color = getColorForTitle(title)
        return {
          start,
          title,
          color,
        }
      })
    )
    console.log(temp)
    setEvents(temp)
  }

  useEffect(() => {
    getRosterList()

    const calApi = calendarRef.current.getApi()
    console.log("calApi.render")
    calApi.render()
  }, [user, refetchTogle])

  return (
    <div className="flex flex-col justify-center items-center pb-10 gap-3">
      {isEditMode && <ShiftSelectList />}

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
        customButtons={{
          editBtn: {
            text: "Edit",
            click: function () {
              console.log("editBtn clicked")
              setIsEditMode(!isEditMode)
            },
          },
        }}
        headerToolbar={{
          left: "editBtn",
          center: "title",
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
