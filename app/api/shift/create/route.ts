import { checkUser } from "@/checkUser"
import prisma from "./../../../prisma"
import { NextRequest } from "next/server"

async function createShift(data) {
  const created = await prisma.shift.create({
    data,
  })
  return created
}

export async function POST(request: NextRequest) {
  console.log("POST: /api/shift/create")
  const body = await request.json()

  const token = request.cookies.get("token")?.value
  const validUser = await checkUser(token, body?.uid)
  if (!validUser) {
    return Response.json({ status: 403 }, { error: "Forbidden" })
  }

  const created = await createShift(body)
  return Response.json({ created })
}
