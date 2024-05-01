import { LegacyRef } from "react"
import FullCalendar from "@fullcalendar/react"
import {
  DayHeaderContentArg,
  Calendar as CalendarRef,
  CalendarOptions,
  EventClickArg,
  EventSourceInput,
} from "@fullcalendar/core"
import { DateClickArg } from "@fullcalendar/interaction"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"

function renderDayHeaderContent(args: DayHeaderContentArg) {
  const myDayNames = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]
  return myDayNames[args.date.getDay()]
}

type CalendarProps = {
  calendarRef: LegacyRef<FullCalendar> | undefined
  events: EventSourceInput
  handleEventClick: (arg: EventClickArg) => void | undefined
  handleDateClick: (arg: DateClickArg) => Promise<void> | void
}

export default function Calendar({ calendarRef, events, handleEventClick, handleDateClick }: CalendarProps) {
  return (
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
            <div className="relative fc-event-title-container overflow-hidden">
              <div className="absolute -top-4 -left-2 text-3xl">🏅</div>
              <div className="fc-event-title fc-sticky">{arg.event.title}</div>
            </div>
          )
        } else {
          return (
            <div className="fc-event-title-container">
              <div className="fc-event-title fc-sticky">{arg.event.title}</div>
            </div>
          )
        }
      }}
    />
  )
}
