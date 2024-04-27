import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"

function renderDayHeaderContent(args) {
  const myDayNames = ["Su", "M", "Tu", "W", "Th", "F", "Sa"]
  return myDayNames[args.date.getDay()]
}

export default function Calendar({ calendarRef, events, handleEventClick, handleDateClick }) {
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
        return true
      }}
    />
  )
}
