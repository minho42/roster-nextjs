"use client"

import { useContext, useEffect, useRef, useState } from "react"
import { UserContext } from "../UserContext"
import { getColorForTitle } from "./../utils"
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

export default function Page() {
  const { user } = useContext(UserContext)

  const [shiftList, setShiftList] = useState([])
  const [refetchTogle, setRefchToggle] = useState(false)
  const inputRef = useRef()

  async function deleteShift(id) {
    console.log("deleteShift")
    const docRef = doc(db, `shifts/${user.uid}/shift/`, id)
    await deleteDoc(docRef)
    setRefchToggle(!refetchTogle)
  }

  async function createShift(e) {
    e.preventDefault()
    console.log("createShift")
    const newTitle = inputRef.current.value.trim()
    if (!newTitle) {
      return
    }

    const docRef = doc(collection(db, `shifts/${user.uid}/shift/`))
    await setDoc(docRef, {
      // uid: user.uid,
      title: newTitle,
      createdAt: serverTimestamp(),
      modifiedAt: serverTimestamp(),
    })

    inputRef.current.value = ""
    inputRef.current.focus()
    setRefchToggle(!refetchTogle)
  }

  async function getShiftList() {
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
  }, [user, refetchTogle])

  if (!user) return <div>...</div>

  return (
    <div className="flex flex-col sm:max-w-lg">
      <h1 className="text-center text-2xl pb-3">Shift list ({shiftList?.length || 0})</h1>
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
                  onClick={() => deleteShift(shift.id)}
                  className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center bg-red-500 text-white rounded text-center text-sm cursor-pointer py-0.5 px-1"
                >
                  Delete
                </div>
              </div>
            ))}
        </div>

        <form onSubmit={createShift}>
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

        <div className="text-neutral-400">once selected: show edit/delete selected</div>
      </div>
    </div>
  )
}
