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
  updateDoc,
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
  const [countDown, setCountDown] = useState(3)

  async function createRoster(uid: string, start: string, shiftId: string) {
    console.log("createRoster")
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
        incharge: false,
      })
    }
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

  async function getShiftTitle(shiftId: string) {
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
        return {
          start: doc.data().start,
          title,
          color: getColorForTitle(title),
          id: doc.id, // "id" to be used for fullcalendar event
          incharge: doc.data().incharge,
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

    let countDownInterval

    if (isPopupVisible) {
      countDownInterval = setInterval(function () {
        setCountDown((countDown) => countDown - 1)
      }, 1000)
    } else {
      setCountDown(3)
      clearInterval(countDownInterval)
    }

    return () => {
      document.removeEventListener("keydown", keyboardShortcuts)
      clearInterval(countDownInterval)
    }
  }, [isPopupVisible])

  useEffect(() => {
    if (popupRef?.current) {
      const deleteBtn = popupRef.current.querySelector("#deleteButton")
      deleteBtn.textContent = countDown > 0 ? `Delete (${countDown})` : "Delete"

      if (countDown > 0) {
        deleteBtn.disabled = true
      } else {
        deleteBtn.disabled = false
      }
    }
  }, [countDown])

  useEffect(() => {
    if (!isEditMode) {
      setSelectedShift(null)
    }
  }, [isEditMode])

  useEffect(() => {
    if (!calendarRef?.current) return

    const calApi = calendarRef.current.getApi()
    const table = calApi.el.querySelector("table")

    if (selectedShift) {
      table.style.borderColor = getColorForTitle(selectedShift.title)
      table.style.borderWidth = "4px"
      table.style.borderStyle = "solid"
    } else {
      table.style.borderColor = "#d4d4d4"
      table.style.borderWidth = "1px"
      table.style.borderStyle = "solid"
    }
  }, [selectedShift])

  function handleEventClick(info) {
    console.log("handleEventClick")
    console.log(info.event)

    if (!info.event?.title) {
      // prevent opening popup when creating a roster
      return
    }

    setSelectedEvent(info.event)
    setIsPopupVisible(true)
    console.log("eventClick", info.event.title)
    const startStr = info.event.start.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    popupRef.current.querySelector("#popupHeading").textContent = `${info.event.title} (${startStr})`
  }

  async function handleDelete() {
    console.log("handleDelete")
    if (!selectedEvent) return

    console.log(`roster/${user.uid}/shift/${selectedEvent.id}`)
    const docRef = doc(db, `roster/${user.uid}/shift/${selectedEvent.id}`)
    await deleteDoc(docRef)
    setRefchToggle(!refetchTogle)

    setIsPopupVisible(false)
  }

  async function handleIncharge(e) {
    console.log("handleIncharge")
    if (!selectedEvent) return

    const newInchargeValue = e.target.id === "yesRadio"
    console.log("newInchargeValue: ", newInchargeValue)

    // setSelectedEvent so radio button "checked" value can change
    setSelectedEvent({
      ...selectedEvent,
      extendedProps: {
        ...selectedEvent.extendedProps,
        incharge: newInchargeValue,
      },
    })

    try {
      const docRef = doc(db, `roster/${user.uid}/shift/${selectedEvent.id}`)
      await updateDoc(docRef, {
        incharge: newInchargeValue,
      })
    } catch (error) {
      console.log(error)
    }

    setRefchToggle(!refetchTogle)
    // switching incharge value from a -> b -> a (back to previous) doesn't work
    // selectedEvent.id: undefined
    // just close the popup once changed
    setIsPopupVisible(false)
  }

  return (
    <div className="flex flex-col justify-center items-center pb-10 gap-3">
      {isEditMode && <ShiftList header={false} setSelectedForParent={setSelectedShift} size={"small"} />}

      <div>
        {user && (
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
        )}
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
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        border border-neutral-400 rounded-xl z-50 ${isPopupVisible ? "inline-block" : "hidden"}`}
      >
        <div
          className="z-10 w-52 rounded-xl text-center bg-white shadow-lg  divide-y overflow-hidden"
          tabIndex={-1}
        >
          <div className="space-y-2 px-2 py-3 bg-blue-100">
            <div id="popupHeading" className="font-semibold"></div>
          </div>

          <div className="space-y-2 py-4">
            <div className="font-semibold">🏅 In-charge</div>

            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col">
                <label htmlFor="yesRadio">
                  <input
                    type="radio"
                    name="inchargeToggle"
                    id="yesRadio"
                    className="w-8 h-8"
                    onChange={handleIncharge}
                    checked={selectedEvent?.extendedProps?.incharge === true}
                  />
                  <p>Yes</p>
                </label>
              </div>
              <div className="flex flex-col">
                <label htmlFor="noRadio">
                  <input
                    type="radio"
                    name="inchargeToggle"
                    id="noRadio"
                    className="w-8 h-8"
                    onChange={handleIncharge}
                    checked={
                      selectedEvent?.extendedProps?.incharge === undefined ||
                      selectedEvent?.extendedProps?.incharge === false
                    }
                  />
                  <p>No</p>
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-2 py-4">
            <div className="font-semibold"></div>
            <button id="deleteButton" onClick={handleDelete} className="btn-red" tabIndex={-1}>
              Delete
            </button>
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
        eventContent={function (arg) {
          if (arg.event.extendedProps.incharge) {
            return (
              <div class="relative fc-event-title-container overflow-hidden">
                <div class="absolute -top-4 -left-2 text-3xl">🏅</div>
                <div class="fc-event-title fc-sticky">{arg.event.title}</div>
              </div>
            )
          } else {
            return (
              <div class="fc-event-title-container">
                <div class="fc-event-title fc-sticky">{arg.event.title}</div>
              </div>
            )
          }
          return true
        }}
      />
    </div>
  )
}
