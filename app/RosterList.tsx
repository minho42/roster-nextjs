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
import { PlusIcon, XMarkIcon, EllipsisVerticalIcon, TrashIcon } from "@heroicons/react/24/outline"
import { DateClickArg } from "@fullcalendar/interaction"

import Calendar from "./Calendar"
import { EventClickArg, EventSourceInput } from "@fullcalendar/core"
import { EventImpl } from "@fullcalendar/core/internal"

export default function RosterList() {
  const calendarRef = useRef(null)
  const popupRef: MutableRefObject<HTMLDivElement | null> = useRef(null)
  const textRef = useRef(null)
  const { user, setUser } = useContext(UserContext) || {}
  const [titles, setTitles] = useState({})
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [events, setEvents] = useState<EventSourceInput | []>([])
  const [refetchTogle, setRefetchToggle] = useState(false)
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventImpl | null>(null)
  const [note, setNote] = useState("")
  const [popupHeading, setPopupHeading] = useState("")

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
    setRefetchToggle(!refetchTogle)
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
          note: doc.data().note,
        }
      })
    )
    // console.log(temp)
    const excludeUndefinedEvents = temp.filter((event) => event.title)
    console.log(excludeUndefinedEvents)
    setEvents(excludeUndefinedEvents)
  }

  function keyboardShortcuts(e: KeyboardEvent) {
    const calApi = calendarRef.current.getApi()

    if (isPopupVisible) {
      if (e.key === "Escape") {
        // esc: close popup
        handlePopupClose()
      }
    } else {
      if (e.key === "p" || e.key === "P") {
        calApi.prev()
      } else if (e.key === "n" || e.key === "N") {
        calApi.next()
      } else if (e.key === "t" || e.key === "T") {
        calApi.today()
      }
    }
  }

  function handlePopupClose() {
    console.log("handlePopupClose")
    setIsPopupVisible(false)
    setNote("")
    textRef.current.value = ""
    setPopupHeading("")
    setSelectedEvent(null)
  }

  useEffect(() => {
    if (!selectedEvent) return
    const note = selectedEvent?.extendedProps?.note
    if (!note) return
    textRef.current.value = note
    setNote(note)
  }, [selectedEvent])

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
  }, [calendarRef.current, isPopupVisible])

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

    setPopupHeading(`${info.event.title} (${startStr})`)
  }

  async function handleDelete() {
    console.log("handleDelete")
    if (!selectedEvent) return

    console.log(`roster/${user.uid}/shift/${selectedEvent.id}`)
    const docRef = doc(db, `roster/${user.uid}/shift/${selectedEvent.id}`)
    await deleteDoc(docRef)
    setRefetchToggle(!refetchTogle)

    setIsPopupVisible(false)
  }

  function handleTextChange() {
    console.log("handleTextChange")
    if (!selectedEvent) return

    console.log(textRef.current.value)
    setNote(textRef.current.value.trim())
  }

  async function handleTextSave() {
    const note = textRef.current.value

    try {
      const docRef = doc(db, `roster/${user.uid}/shift/${selectedEvent.id}`)
      await updateDoc(docRef, {
        note: note,
      })
    } catch (error) {
      console.log(error)
    }

    setRefetchToggle(!refetchTogle)
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

    setRefetchToggle(!refetchTogle)
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
            className={`absolute top-1 right-1 !rounded-full size-12 text-3xl ${
              isEditMode ? "btn-red" : "btn-blue"
            }`}
          >
            <div className="relative flex items-center justify-center w-full h-full">
              {isEditMode ? (
                <XMarkIcon className="absolute size-8" title="Hide shift list" />
              ) : (
                <PlusIcon className="absolute size-8" title="Show shift list" />
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
        className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 
        border bg-white border-neutral-400 rounded-xl z-50 ${isPopupVisible ? "inline-block" : "hidden"}`}
      >
        <div
          className="z-10 w-56 rounded-xl text-center bg-white shadow-2xl overflow-hidden px-2 py-2"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between px-2 pb-2">
            <div
              onClick={handleDelete}
              className="hover:bg-neutral-100 rounded-full px-2.5 py-2.5 cursor-pointer"
              title="Delete"
            >
              <TrashIcon className="size-5" />
            </div>
            <div
              onClick={handlePopupClose}
              className="flex items-center justify-center bg-neutral-100 rounded-full px-2.5 py-2.5 cursor-pointer"
              title="Close"
            >
              <XMarkIcon className="size-6" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 py-2">
            <div
              className="rounded size-4"
              style={{ backgroundColor: getColorForTitle(selectedEvent?.title) }}
            ></div>
            <div className="font-semibold">{popupHeading}</div>
          </div>
          <div className="space-y-2 py-2">
            <div className="">🏅 In-charge</div>

            <div className="flex items-center justify-evenly gap-6">
              <div className="flex flex-col">
                <label htmlFor="yesRadio">
                  <input
                    type="radio"
                    name="inchargeToggle"
                    id="yesRadio"
                    className="size-8"
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
                    className="size-8"
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
          <hr />
          <div className="space-y-2 p-2">
            <div className="">Note</div>
            <textarea
              ref={textRef}
              className="w-full border border-neutral-300 p-1"
              onChange={handleTextChange}
              name="note"
              id="note"
              rows={2}
            ></textarea>
            <button
              // className={`${
              //   note.length > 0 ? "btn-blue border-transparent " : "btn-disabled"
              // } w-full border border-neutral-300`}
              className="btn-blue w-full "
              onClick={handleTextSave}
            >
              Save
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
