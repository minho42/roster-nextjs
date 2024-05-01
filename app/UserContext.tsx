import React, { createContext, useState, ReactNode } from "react"
import { User } from "firebase/auth"

type ProviderData = {
  providerId: string
  uid: string
  displayName: string
  email: string
  phoneNumber: string | null
  photoURL: string | null
}

type StsTokenManager = {
  refreshToken: string
  accessToken: string
  expirationTime: number
}

type UserMetadata = {
  createdAt: string
  lastLoginAt: string
}

type UserProviderProps = {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export const UserContext = createContext<UserProviderProps | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, setIsLoading }}>{children}</UserContext.Provider>
  )
}
