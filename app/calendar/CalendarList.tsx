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
import ShiftList, { Shift } from "../components/ShiftList"

function renderDayHeaderContent(args) {
  const myDayNames = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]
  return myDayNames[args.date.getDay()]
}

function handleEventClick(info) {
  console.log("eventClick", info.event.title)
}

export default function CalendarList() {
  const calendarRef = useRef()
  const { user, setUser } = useContext(UserContext)
  const [titles, setTitles] = useState({})
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isEditMode, setIsEditMode] = useState(true)
  const [isFollowingCursor, setIsFollowingCursor] = useState(true)
  const [events, setEvents] = useState([])
  const [refetchTogle, setRefchToggle] = useState(false)

  async function createRoster(uid, start, shiftId) {
    console.log("createRoster")
    // Create roster using relashipship of shift
    const docRef = doc(collection(db, `roster/${uid}/shift/`))
    await setDoc(docRef, {
      start,
      shift: doc(collection(db, `shifts/${uid}/shift`), shiftId),
    })

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
      // title: selectedShift ? selectedShift?.title : "...",
      title: "...",
      start: info.dateStr,
      backgroundColor: selectedShift ? getColorForTitle(selectedShift?.title) : "#fff",
      // borderColor: "#fff",
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
      {isEditMode && <ShiftList header={false} setSelectedShift={setSelectedShift} size={"small"} />}

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
