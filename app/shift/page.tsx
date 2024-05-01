"use client"

import { useContext, useEffect, useRef, useState, FormEvent } from "react"
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
  const { user } = useContext(UserContext) || {}
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [refetchTogle, setRefchToggle] = useState(false)
  const inputCreateRef = useRef(null)
  const inputUpdateRef = useRef(null)

  async function handleDelete(id: string) {
    console.log("handleDelete")
    const docRef = doc(db, `shifts/${user?.uid}/shift/`, id)
    await deleteDoc(docRef)

    setRefchToggle(!refetchTogle)
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!selectedShift) {
      return
    }
    console.log("handleUpdate")
    const newTitle = inputUpdateRef.current.value.trim()
    if (!newTitle) {
      return
    }

    const docRef = doc(db, `shifts/${user?.uid}/shift`, selectedShift.id)
    // await setDoc(docRef, {
    //   // uid: user.uid,
    //   title: newTitle,
    //   modifiedAt: serverTimestamp(),
    // })
    await updateDoc(docRef, {
      title: newTitle,
      modifiedAt: serverTimestamp(),
    })

    inputCreateRef.current.value = ""
    inputUpdateRef.current.value = ""
    inputUpdateRef.current.focus()
    setRefchToggle(!refetchTogle)
  }

  async function handleCreate(e: FormEvent) {
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

    inputUpdateRef.current.value = ""
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

      {!selectedShift && (
        <form onSubmit={handleCreate}>
          <div className="flex items-center justify-center gap-2">
            <label htmlFor="create" className="flex items-center justify-center font-semibold ">
              Add
              <input
                ref={inputCreateRef}
                type="text"
                id="create"
                name="create"
                maxLength={12}
                placeholder=""
                className="w-28 border border-neutral-400 rounded py-2 px-3 ml-2 font-normal"
                disabled={selectedShift ? true : false}
              />
            </label>
            <button className={`${selectedShift ? "btn-disabled" : "btn-blue"}`}>Add</button>
          </div>
        </form>
      )}

      {selectedShift && (
        <form onSubmit={handleUpdate}>
          <div className="flex items-center justify-center gap-2">
            <label htmlFor="update" className="flex items-center justify-center font-semibold  text-right">
              {selectedShift ? `Change \[${selectedShift.title}\] to ` : "Update"}
              <input
                ref={inputUpdateRef}
                type="text"
                id="update"
                name="update"
                maxLength={12}
                placeholder=""
                className="w-28 border border-neutral-400 rounded py-2 px-3 ml-2 font-normal"
              />
            </label>
            <button className={`${!selectedShift ? "btn-disabled" : "btn-blue"}`}>Update</button>
          </div>
        </form>
      )}

      {selectedShift && (
        <div className="text-center space-y-1 py-6">
          <p className="text-sm text-red-400">This will delete shifts from the Roster too</p>
          <button
            onClick={() => handleDelete(selectedShift.id)}
            className={`${!selectedShift ? "btn-disabled" : "btn-red"}`}
            disabled={selectedShift === null}
          >
            Delete {selectedShift && `[${selectedShift?.title}]`}
          </button>
        </div>
      )}
    </div>
  )
}
