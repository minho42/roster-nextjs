"use client"

import { useState, useEffect, useRef, useContext, MutableRefObject, ChangeEvent } from "react"
import { UserContext } from "./UserContext"
import { getColorForTitle } from "./utils"
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
import { ShiftList, Shift } from "./components/ShiftList"
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { DateClickArg } from "@fullcalendar/interaction"

import Calendar from "./Calendar"
import { EventClickArg, EventSourceInput } from "@fullcalendar/core"
import { EventImpl } from "@fullcalendar/core/internal"

export default function RosterList() {
  const calendarRef = useRef(null)
  const popupRef: MutableRefObject<HTMLDivElement | null> = useRef(null)
  const { user, setUser } = useContext(UserContext) || {}
  const [titles, setTitles] = useState({})
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [events, setEvents] = useState<EventSourceInput | []>([])
  const [refetchTogle, setRefchToggle] = useState(false)
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventImpl | null>(null)
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

  async function handleDateClick(info: DateClickArg) {
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
      isFake: true,
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
    if (docSnap.exists()) {
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

  function keyboardShortcuts(e: KeyboardEvent) {
    // if (!isPopupVisible) return

    const calApi = calendarRef.current.getApi()

    if (e.key === "Escape") {
      // esc: close popup
      handlePopupClose()
    } else if (e.key === "p" || e.key === "P") {
      calApi.prev()
    } else if (e.key === "n" || e.key === "N") {
      calApi.next()
    } else if (e.key === "t" || e.key === "T") {
      calApi.today()
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
  }, [calendarRef.current])

  useEffect(() => {
    document.addEventListener("keydown", keyboardShortcuts)

    let countDownInterval: NodeJS.Timeout | undefined

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
      const deleteBtn = popupRef.current.querySelector<HTMLButtonElement>("#deleteButton")
      if (!deleteBtn) return

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
    const table: HTMLTableElement | null = calApi.el.querySelector("table")
    if (!table) return

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

  function handleEventClick(info: EventClickArg): void | undefined {
    console.log("handleEventClick")
    console.log(JSON.stringify(info.event))

    // when creating roster by selecting a date,
    // it somehow triggers eventClick (handleEventClick) too after dateClick (handleDateClick)
    // which results in popup with optimistic event title ("...")
    // this only happens on mobile (real device)
    // adding and checking for 'isFake' prevents this
    if (info.event.extendedProps.isFake) return

    setSelectedEvent(info.event)
    setIsPopupVisible(true)
    console.log("eventClick", info.event.title)
    const startStr = info.event.start.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    const popupHeading: HTMLDivElement | null = popupRef.current.querySelector("#popupHeading")
    if (popupHeading) {
      popupHeading.textContent = `${info.event.title} (${startStr})`
    }
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

  async function handleIncharge(e: ChangeEvent<HTMLInputElement>) {
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
      {isEditMode && (
        <div className="bg-blue-100 flex w-full items-center justify-center p-2">
          <ShiftList header={false} setSelectedForParent={setSelectedShift} size={"small"} />
        </div>
      )}

      <div>
        {user && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`absolute top-1 right-1 !rounded-full w-12 h-12 text-3xl ${
              isEditMode ? "btn-red" : "btn-blue"
            }`}
          >
            <div className="relative flex items-center justify-center w-full h-full">
              {isEditMode ? (
                <XMarkIcon className="absolute w-8 h-8" title="Hide shift list" />
              ) : (
                <PlusIcon className="absolute w-8 h-8" title="Show shift list" />
              )}
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

      <Calendar
        calendarRef={calendarRef}
        events={events}
        handleEventClick={handleEventClick}
        handleDateClick={handleDateClick}
      />
    </div>
  )
}
