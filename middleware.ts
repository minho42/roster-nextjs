import { checkUser } from "@/checkUser"
import { getAuth } from "firebase/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyFirebaseJWT } from "./verifyFirebaseJWT"

export function middleware(request: NextRequest) {
  console.log("middleware")
  const tokenCookie = request.cookies.get("token")
  //   console.log(tokenCookie?.value)
  if (!tokenCookie || !tokenCookie?.value) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const response = NextResponse.next()
  // response.cookies.set("vercel", "cookies from middleware") // <-- not working, cookies not set

  verifyFirebaseJWT(tokenCookie?.value)
    .then((jwtData) => {
      // console.log("verifyFirebaseJWT")
      // console.log("user_id: ", jwtData?.user_id)
      if (!jwtData || !jwtData?.user_id) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      return response
    })
    .catch((error) => {
      console.log("Invalid token", error)
    })
}

export const config = {
  matcher: ["/calendar/:path*", "/shift/:path*", "/profile/:path*"],
}
