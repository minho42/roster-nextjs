import { cookies } from "next/headers"

export async function POST(request: Request) {
  console.log("POST:", request.url)
  const deleted = cookies().delete("token")
  return Response.json({ data: "token cookie deleted" })
}
