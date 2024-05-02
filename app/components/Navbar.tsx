"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { auth, handleLogin } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"

import { useEffect, useContext } from "react"
import { UserContext } from "../UserContext"
import { UserCircleIcon, MagnifyingGlassCircleIcon } from "@heroicons/react/24/outline"

export default function Navbar() {
  const pathname = usePathname()
  const contextValue = useContext(UserContext)

  if (!contextValue) {
    return null
  }

  const { user, setUser, isLoading, setIsLoading } = contextValue

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
    <nav className="flex items-center justify-center w-full flex-wrap sm:max-w-2xl px-4 h-10 gap-2 text-neutral-500">
      <Link href="/" className={` ${pathname === "/" ? "text-black font-semibold " : ""}`}>
        Roster
      </Link>
      |
      <Link href="/shift" className={` ${pathname.includes("/shift") ? "text-black font-semibold " : ""}`}>
        Shift
      </Link>
      |
      {isLoading && (
        <div>
          <MagnifyingGlassCircleIcon
            className="size-8 animate-pulse text-neutral-400 "
            title="Checking user"
          />
        </div>
      )}
      {!isLoading && user && (
        <>
          <Link
            href="/profile"
            className={` ${pathname.includes("/profile") ? "text-black font-semibold " : ""}`}
          >
            <UserCircleIcon className="size-8" />
          </Link>
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
