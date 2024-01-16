const colors = {
  AM: "#fbaf5d",
  PM: "#42b983",
  NIGHT: "#a186be",
  OFF: "#ddd",
  LEAVE: "#fecddd",
  STUDY: "#bee9db",
}

export function getColorForTitle(t: string): string {
  if (!t) return colors.OFF

  const title = t.toUpperCase()
  let color = ""
  if (["DO", "ADO", "O"].includes(title)) {
    color = colors.OFF
  } else if (["A", "AM", "A6", "DAY", "EARLY", "MORNING"].includes(title)) {
    color = colors.AM
  } else if (["P", "PM", "P6", "EVENING", "AFTERNOON"].includes(title)) {
    color = colors.PM
  } else if (["N", "ND", "NIGHT"].includes(title)) {
    color = colors.NIGHT
  } else if (
    [
      "ANNUAL",
      "AWOL",
      "BREAK",
      "CARERS",
      "COURT",
      "COVID",
      "FACS",
      "JURY",
      "LSL",
      "LWOP",
      "MATERN",
      "PARENT",
      "PH",
      "SICK",
      "SLEEP",
      "SPECIAL",
    ].some((s) => title.includes(s))
  ) {
    color = colors.LEAVE
  } else if (["CONF", "COURSE", "STUDY"].some((s) => title.includes(s))) {
    color = colors.STUDY
  } else {
    color = colors.OFF
  }
  return color
}
