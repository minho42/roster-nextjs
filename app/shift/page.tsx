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
  updateDoc,
} from "firebase/firestore"
import { ShiftList, Shift } from "../components/ShiftList"

export default function Page() {
  const { user } = useContext(UserContext)
  const [shiftList, setShiftList] = useState([])
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [refetchTogle, setRefchToggle] = useState(false)
  const inputCreateRef = useRef(null)
  const inputUpdateRef = useRef(null)

  async function handleDelete(id) {
    console.log("handleDelete")
    const docRef = doc(db, `shifts/${user.uid}/shift/`, id)
    await deleteDoc(docRef)

    setRefchToggle(!refetchTogle)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!selectedShift) {
      return
    }
    console.log("handleUpdate")
    const newTitle = inputUpdateRef.current.value.trim()
    if (!newTitle) {
      return
    }

    const docRef = doc(db, `shifts/${user.uid}/shift`, selectedShift.id)
    // await setDoc(docRef, {
    //   // uid: user.uid,
    //   title: newTitle,
    //   modifiedAt: serverTimestamp(),
    // })
    await updateDoc(docRef, {
      title: newTitle,
      modifiedAt: serverTimestamp(),
    })

    inputUpdateRef.current.value = ""
    inputUpdateRef.current.focus()
    setRefchToggle(!refetchTogle)
  }

  async function handleCreate(e) {
    e.preventDefault()
    console.log("handleCreate")
    const newTitle = inputCreateRef.current.value.trim()
    if (!newTitle) {
      return
    }

    // check for duplicate
    const shiftColRef = collection(db, `shifts/${user.uid}/shift/`)
    const querySnapshot = await getDocs(shiftColRef)
    const duplicate = querySnapshot.docs.find(
      (doc) => doc.data().title.toLowerCase() === newTitle.toLowerCase()
    )
    if (duplicate) {
      console.log("Not created: duplicate title")
    } else {
      const docRef = doc(shiftColRef)
      await setDoc(docRef, {
        title: newTitle,
        createdAt: serverTimestamp(),
        modifiedAt: serverTimestamp(),
      })
    }

    inputCreateRef.current.value = ""
    inputCreateRef.current.focus()
    setRefchToggle(!refetchTogle)
  }

  if (!user) return <div>...</div>

  return (
    <div className="flex flex-col gap-3 py-3">
      <ShiftList
        header={true}
        setSelectedForParent={setSelectedShift}
        size={"medium"}
        refetchTogle={refetchTogle}
      />

      <form onSubmit={handleCreate}>
        <div className="flex items-start justify-center gap-2">
          <label htmlFor="create" className="font-semibold mb-2">
            Add
            <input
              ref={inputCreateRef}
              type="text"
              id="create"
              name="create"
              maxLength={12}
              placeholder=""
              className="w-32 border border-neutral-400 rounded py-2 px-3 ml-2"
            />
          </label>
          <button className={`${selectedShift ? "btn-disabled" : "btn-blue"}`}>Add</button>
        </div>
      </form>

      <form onSubmit={handleUpdate}>
        <div className="flex items-start justify-center gap-2">
          <label htmlFor="update" className="font-semibold mb-2">
            {selectedShift ? `Change \"${selectedShift.title}\" to ` : "Update"}
            <input
              ref={inputUpdateRef}
              type="text"
              id="update"
              name="update"
              maxLength={12}
              placeholder=""
              className="w-32 border border-neutral-400 rounded py-2 px-3 ml-2"
            />
          </label>
          <button className={`${!selectedShift ? "btn-disabled" : "btn-blue"}`}>Update</button>
        </div>
      </form>

      <div className="text-center space-y-1 py-6">
        {selectedShift && <p className="text-sm text-red-400">This will delete shifts from the Roster too</p>}
        <button
          onClick={() => handleDelete(selectedShift.id)}
          className={`${!selectedShift ? "btn-disabled" : "btn-red"}`}
          disabled={selectedShift === null}
        >
          Delete {selectedShift && `[${selectedShift?.title}]`}
        </button>
      </div>
    </div>
  )
}
