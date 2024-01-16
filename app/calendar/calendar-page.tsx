"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { useState, useEffect, useRef, useContext } from "react"
import { UserContext } from "../UserContext"
import prisma from "./../prisma"

function renderDayHeaderContent(args) {
  const myDayNames = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]
  return myDayNames[args.date.getDay()]
}
function handleEventClick(info) {
  console.log("eventClick", info.event.title)
}

export default function CalendarPage() {
  const calendarRef = useRef()
  const { user, setUser } = useContext(UserContext)
  const [events, setEvents] = useState([])
  const [refetchTogle, setRefchToggle] = useState(false)

  async function handleDateClick(info) {
    console.log("dateClick", info.dateStr)
    if (!user) return

    // optimistically add first
    const calApi = calendarRef.current.getApi()
    calApi.addEvent({
      id: user.id,
      title: "...",
      // start: new Date(info.dateStr).toISOString(),
      start: info.dateStr,
      backgroundColor: "#fff",
      borderColor: "#fff",
      textColor: "#000",
    })

    try {
      const res = await fetch("/api/event/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          uid: user.uid,
          start: info.dateStr,
          shiftId: 1,
        }),
      })
      if (!res.ok) {
        throw new Error("handleDateClick request failed")
      }
      const result = await res.json()
      console.log(result)
      setRefchToggle(!refetchTogle)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) {
          setEvents([])
          return
        }

        const res = await fetch("/api/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ uid: user.uid }),
        })
        if (!res.ok) {
          throw new Error("fetchData failed")
        }
        const data = await res.json()
        setEvents(data)
        console.log(data)
      } catch (error) {
        console.log(error)
        setEvents([])
      }
    }
    fetchData()

    const calApi = calendarRef.current.getApi()
    console.log("calApi.render")
    calApi.render()
  }, [user, refetchTogle])

  return (
    <div className="flex pb-10">
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
