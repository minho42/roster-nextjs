import React, { createContext, useState, ReactNode } from "react"

type FirebaseUser = {
  uid: string
  email: string
  emailVerified: boolean
  displayName: string
  isAnonymous: boolean
  photoURL: string | null
  providerData: ProviderData[]
  stsTokenManager: StsTokenManager
  metadata: UserMetadata
  createdAt: string
  lastLoginAt: string
  apiKey: string
  appName: string
}

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
  user: FirebaseUser | null
  setUser: React.Dispatch<React.SetStateAction<FirebaseUser | null>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export const UserContext = createContext<UserProviderProps | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, setIsLoading }}>{children}</UserContext.Provider>
  )
}
