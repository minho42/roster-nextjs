import { getColorForTitle } from "@/app/utils"
import prisma from "../../prisma"
import { NextRequest } from "next/server"
import { checkUser } from "@/checkUser"

async function getRoster(uid: string) {
  const roster = await prisma.roster.findMany({ where: { uid: uid } })
  const roster2 = roster.map(async (item) => {
    const shift = await prisma.shift.findUnique({
      where: { id: item.shiftId },
    })
    return {
      // start: item.start.toISOString().split("T")[0],
      start: item.start,
      title: shift?.title,
      color: getColorForTitle(shift?.title),
    }
  })
  const result = await Promise.all(roster2)
  return result
}

export async function POST(request: NextRequest) {
  console.log("POST:", request.url)
  const body = await request.json()

  const token = request.cookies.get("token")?.value
  const validUser = await checkUser(token, body?.uid)
  if (!validUser) {
    return Response.json({ status: 403 }, { error: "Forbidden" })
  }

  const roster = await getRoster(body.uid)
  return Response.json(roster)
}
