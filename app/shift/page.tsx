"use client"

import { useContext, useEffect, useRef, useState } from "react"
import { UserContext } from "../UserContext"
import { getColorForTitle } from "./../utils"

export default function Page() {
  const { user } = useContext(UserContext)

  const [shiftList, setShiftList] = useState([])
  const [refetchTogle, setRefchToggle] = useState(false)
  const inputRef = useRef()

  async function deleteShift(title) {
    console.log("delete shift for: ", title)
    try {
      const res = await fetch("/api/shift/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          uid: user.uid,
          title,
        }),
      })
      const result = await res.json()
      console.log(result)
      setRefchToggle(!refetchTogle)
    } catch (error) {
      console.log(error)
    }
  }

  async function addShift(e) {
    e.preventDefault()
    console.log("add shift for: ", user.uid)
    const newTitle = inputRef.current.value.trim()
    if (!newTitle) return

    try {
      const res = await fetch("/api/shift/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          uid: user.uid,
          title: newTitle,
        }),
      })
      const result = await res.json()
      console.log(result)
      inputRef.current.value = ""
      inputRef.current.focus()
      setRefchToggle(!refetchTogle)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    async function getShiftList() {
      if (!user) {
        return setShiftList([])
      }

      const res = await fetch("/api/shift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          uid: user?.uid,
        }),
      })
      const data = await res.json()
      setShiftList(data)
    }
    getShiftList()
  }, [user, refetchTogle])

  if (!user) return <div>...</div>

  return (
    <div className="flex flex-col sm:max-w-lg">
      <h1 className="text-center text-2xl pb-3">Shift list</h1>
      <div className="flex flex-col gap-6">
        <div
          className="flex items-center justify-center gap-3 flex-wrap p-4 
        border border-neutral-300 rounded-lg"
        >
          {shiftList &&
            shiftList.length > 0 &&
            shiftList.map((shift) => (
              <div key={shift.id} className="flex space-y-1 group relative">
                <div
                  style={{ backgroundColor: getColorForTitle(shift.title) }}
                  className="flex items-center justify-center min-w-20 min-h-20 rounded-md p-2"
                >
                  {shift.title}
                </div>
                <div
                  onClick={() => deleteShift(shift.title)}
                  className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center bg-red-500 text-white rounded text-center text-sm cursor-pointer py-0.5 px-1"
                >
                  Delete
                </div>
              </div>
            ))}
        </div>

        <form onSubmit={addShift}>
          <div className="flex items-start justify-center gap-2">
            <label htmlFor="title" className="font-semibold mb-2">
              Name
              <input
                ref={inputRef}
                type="text"
                id="title"
                name="title"
                maxLength={12}
                placeholder="new shift"
                className="w-32 border border-neutral-400 rounded py-2 px-3 ml-2"
              />
            </label>
            <button className="btn">Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}
