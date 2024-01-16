"use client"
import { useContext } from "react"
import { UserContext } from "../UserContext"

export default function Page() {
  const { user } = useContext(UserContext)
  if (!user) return <div>...</div>

  return (
    <div>
      <p>{user.uid}</p>
      <p>{user.displayName}</p>
      <p>{user.email}</p>
    </div>
  )
}
