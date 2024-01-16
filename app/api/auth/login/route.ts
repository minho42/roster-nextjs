import { cookies } from "next/headers"

export async function POST(request: Request) {
  console.log("POST:", request.url)
  const { token } = await request.json()
  //   console.log(token)
  if (!token || token?.length == 0) {
    throw new Error("Invalid token")
  }
  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })

  return Response.json({ data: "httponly token cookie set" })
}
