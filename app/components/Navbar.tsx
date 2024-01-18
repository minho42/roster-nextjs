"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { auth, handleLogin, handleLogout } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"

import { useEffect, useContext } from "react"
import { UserContext } from "../UserContext"

export default function Navbar() {
  const pathname = usePathname()
  const { user, setUser, isLoading, setIsLoading } = useContext(UserContext)

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsLoading(false)
      if (user) {
        console.log("changed: user login", user.uid)
        setUser(user)
      } else {
        console.log("changed: user logout")
        setUser(null)
      }
    })
  }, [])

  return (
    // <nav className="flex justify-evenly items-center w-full flex-wrap sm:max-w-2xl px-4 h-12 gap-3">
    <nav className="flex items-center w-full flex-wrap sm:max-w-2xl px-4 h-10 gap-2 text-neutral-500">
      <Link href="/" className={` ${pathname === "/" ? "text-black font-semibold " : ""}`}>
        Home
      </Link>
      |
      <Link
        href="/calendar"
        className={` ${pathname.includes("/calendar") ? "text-black font-semibold " : ""}`}
      >
        Calendar
      </Link>
      |
      <Link href="/shift" className={` ${pathname.includes("/shift") ? "text-black font-semibold " : ""}`}>
        Shift
      </Link>
      |{isLoading && <div className="bg-black rounded-md text-white text-sm px-2 py-1">Loading user...</div>}
      {!isLoading && user && (
        <>
          <Link
            href="/profile"
            className={` ${pathname.includes("/profile") ? "text-black font-semibold " : ""}`}
          >
            Profile
          </Link>
          |
          <button onClick={handleLogout} className="">
            Logout
          </button>
        </>
      )}
      {!isLoading && !user && (
        <>
          <button onClick={handleLogin} className="">
            Login
          </button>
        </>
      )}
    </nav>
  )
}
