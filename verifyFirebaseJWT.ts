import * as jose from "jose"

let publicKeys: any

async function getPublicKeys() {
  if (publicKeys) {
    return publicKeys
  }
  const res = await fetch(
    `https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com`
  )
  publicKeys = await res.json()
  return publicKeys
}

export async function verifyFirebaseJWT(token: string) {
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const algorithm = "RS256"
  const publicKeys = await getPublicKeys()
  const decodedToken = await jose.jwtVerify(
    token,
    async (header, _alg) => {
      const x509 = publicKeys[header.kid]
      const publicKey = await jose.importX509(x509, algorithm)
      return publicKey
    },
    {
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      audience: firebaseProjectId,
      //   algorithms: [algorithm],
    }
  )
  return decodedToken.payload
}
