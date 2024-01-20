"use client"
import { useContext } from "react"
import { UserContext } from "../UserContext"
import { handleLogout } from "../firebase"

export default function Page() {
  const { user } = useContext(UserContext)
  if (!user) return <div>...</div>

  return (
    <div className="flex flex-col justify-center gap-3 py-3">
      <div>
        <p>{user.displayName}</p>
        <p>{user.email}</p>
      </div>

      <div>
        <button onClick={handleLogout} className="underline text-red-500">
          Logout
        </button>
      </div>
    </div>
  )
}
