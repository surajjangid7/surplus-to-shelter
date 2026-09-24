import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import db from "../firebase/firestore";


export const createNotification = async ({
  userId,
  title,
  message,
  type = "GENERAL"
}) => {

  if (!userId) {
    throw new Error(
      "Notification user ID is required."
    );
  }


  await addDoc(
    collection(
      db,
      "notifications"
    ),
    {
      userId,

      title,

      message,

      type,

      read: false,

      createdAt:
        serverTimestamp()
    }
  );
};