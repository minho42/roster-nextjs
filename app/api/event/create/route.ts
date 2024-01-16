import { checkUser } from "@/checkUser"
import prisma from "../../../prisma"
import { NextRequest } from "next/server"

async function createEvent(data) {
  const created = await prisma.roster.create({
    data,
  })
  console.log(created)
  return created
}

export async function POST(request: NextRequest) {
  console.log("POST:", request.url)
  const body = await request.json()

  const token = request.cookies.get("token")?.value
  const validUser = await checkUser(token, body?.uid)
  if (!validUser) {
    return Response.json({ status: 403 }, { error: "Forbidden" })
  }

  const created = await createEvent(body)
  return Response.json({ created })
}
