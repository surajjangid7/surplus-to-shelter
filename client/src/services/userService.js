import { doc, setDoc } from "firebase/firestore";
import { registerUser } from "../firebase/auth";
import db from "../firebase/firestore";

export const createUser = async (userData) => {
  const result = await registerUser(
    userData.email,
    userData.password
  );

  const uid = result.user.uid;

  await setDoc(doc(db, "users", uid), {
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    role: userData.role,
    organization: userData.organization || "",
    verified: false,
    createdAt: new Date()
  });

  return result.user;
};