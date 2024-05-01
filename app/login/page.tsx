"use client"

import { useContext } from "react"
import { handleLogin } from "./../firebase"
import { UserContext } from "../UserContext"

export default function page() {
  const { user } = useContext(UserContext) || {}
  if (user) {
    return <p>You're logged in</p>
  }
  return (
    <div>
      <button onClick={handleLogin} className="btn">
        Login
      </button>
    </div>
  )
}
