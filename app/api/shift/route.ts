import prisma from "./../../prisma"
import { NextRequest } from "next/server"
import { checkUser } from "@/checkUser"

async function getShiftList(uid: string) {
  const shiftList = await prisma.shift.findMany({
    where: {
      uid,
    },
  })
  return shiftList
}

export async function POST(request: NextRequest) {
  console.log("POST:", request.url)
  const body = await request.json()

  const token = request.cookies.get("token")?.value
  const validUser = await checkUser(token, body?.uid)
  if (!validUser) {
    return Response.json({ status: 500 }, { error: "Forbidden" })
  }

  const shiftList = await getShiftList(body.uid)
  return Response.json(shiftList)
}
