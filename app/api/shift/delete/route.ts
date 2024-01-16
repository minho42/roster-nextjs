import { NextRequest } from "next/server"
import prisma from "./../../../prisma"
import { checkUser } from "@/checkUser"

async function deleteShift(data) {
  console.log(data)
  try {
    const deleted = await prisma.shift.delete({
      where: {
        uid_title: {
          uid: data.uid,
          title: data.title,
        },
      },
    })
    return deleted
  } catch (error) {
    console.log("💀 deleteShift error")
    console.log(error)
    return error
  }
}

export async function POST(request: NextRequest) {
  console.log("POST:", request.url)
  const body = await request.json()

  const token = request.cookies.get("token")?.value
  const validUser = await checkUser(token, body?.uid)
  if (!validUser) {
    return Response.json({ status: 403 }, { error: "Forbidden" })
  }

  const deleted = await deleteShift(body)
  return Response.json({ deleted })
}
