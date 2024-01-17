import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth"

const provider = new GoogleAuthProvider()

const firebaseConfig = {
  apiKey: "AIzaSyC8ZvAS8MIFL3nnkGGXGx5vOmEKhErpv5s",
  authDomain: "roster-f37c5.firebaseapp.com",
  projectId: "roster-f37c5",
  storageBucket: "roster-f37c5.appspot.com",
  messagingSenderId: "54517641487",
  appId: "1:54517641487:web:0ad8928b961f0208284e7a",
}
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export async function handleLogin() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result)
    })
    .catch((error) => {
      console.log(error)
      const email = error.customData.email
      console.log(email)
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.log(credential)
    })
}
export async function handleLogout() {
  await signOut(auth)
}
