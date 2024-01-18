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
  Timestamp,
} from "firebase/firestore"

export type Shift = {
  uid: string
  createdAt: Timestamp
  modifiedAt: Timestamp
  title: string
  id: string
}

type PropType = {
  header: boolean
  setSelectedShift: React.Dispatch<React.SetStateAction<Shift | null>>
  size: "small" | "medium" | "large"
  refetchTogle: boolean
}

export default function ShiftList({ header, setSelectedShift, size, refetchTogle }: PropType) {
  const { user } = useContext(UserContext)

  const [shiftList, setShiftList] = useState([])
  const [selected, setSelected] = useState(null)
  const inputRef = useRef()

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
      {header && <h1 className="text-center text-2xl pb-3">Shift list ({shiftList?.length || 0})</h1>}
      <div className="flex flex-col gap-6">
        <div
          className="flex items-center justify-center gap-3 flex-wrap p-4 
            border border-neutral-300 rounded-lg"
        >
          {shiftList &&
            shiftList.length > 0 &&
            shiftList.map((shift) => (
              <div
                onClick={() => {
                  setSelected(shift)
                  setSelectedShift(shift)
                }}
                key={shift.id}
                className={`flex space-y-1 group relative rounded-lg 
                 ${
                   shift.id === selected?.id
                     ? "border-2 border-black shadow-lg text-2xl"
                     : "border-2 border-white"
                 }`}
              >
                <div
                  style={{ backgroundColor: getColorForTitle(shift.title) }}
                  className={`flex items-center justify-center rounded-md p-2 
                  ${
                    size === "large"
                      ? " min-w-20 min-h-20 text-2xl "
                      : size === "medium"
                      ? " min-w-14 min-h-14 text-xl "
                      : size === "small"
                      ? " min-w-10 min-h-10 text-lg "
                      : " min-w-10 min-h-10 "
                  }
                  `}
                >
                  {shift.title}
                </div>
              </div>
            ))}
          <div className="flex flex-wrap break-all text-xs font-mono text-neutral-400">
            {selected ? (
              <div>
                {JSON.stringify(selected)}
                <p
                  className="text-center text-blue-600 underline cursor-pointer"
                  onClick={() => {
                    setSelected(null)
                    setSelectedShift(null)
                  }}
                >
                  Unselect
                </p>
              </div>
            ) : (
              <p>"Not selected"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
