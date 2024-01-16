import { NextRequest } from "next/server"
import { verifyFirebaseJWT } from "./verifyFirebaseJWT"

export async function checkUser(token: string, uid: string): Promise<boolean> {
  if (!token || token?.length == 0 || !uid || uid?.length == 0) {
    return false
  }
  const verifiedPayload = await verifyFirebaseJWT(token)

  if (verifiedPayload?.user_id === uid) {
    return true
  }
  return false
}
