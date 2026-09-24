import { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";

import { auth } from "../firebase/auth";
import db from "../firebase/firestore";

function Notifications() {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      setError("Please login first.");
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where(
        "userId",
        "==",
        user.uid
      )
    );

    const unsubscribe = onSnapshot(
      q,

      (snapshot) => {

        const list = [];

        snapshot.forEach((item) => {

          list.push({
            id: item.id,
            ...item.data()
          });

        });


        // Sort newest first
        list.sort((a, b) => {

          let timeA = 0;
          let timeB = 0;

          if (
            a.createdAt &&
            typeof a.createdAt.toMillis ===
              "function"
          ) {
            timeA =
              a.createdAt.toMillis();
          }

          if (
            b.createdAt &&
            typeof b.createdAt.toMillis ===
              "function"
          ) {
            timeB =
              b.createdAt.toMillis();
          }

          return timeB - timeA;

        });


        setNotifications(list);
        setError("");
        setLoading(false);

      },

      (firebaseError) => {

        console.error(
          "Notification listener error:",
          firebaseError
        );

        if (
          firebaseError.code ===
          "permission-denied"
        ) {

          setError(
            "You do not have permission to view notifications."
          );

        } else {

          setError(
            firebaseError.message
          );

        }

        setLoading(false);

      }
    );


    return () => {
      unsubscribe();
    };

  }, []);


  // MARK AS READ

  const markAsRead = async (
    notificationId
  ) => {

    try {

      await updateDoc(
        doc(
          db,
          "notifications",
          notificationId
        ),
        {
          read: true
        }
      );

    } catch (error) {

      console.error(
        "Mark as read error:",
        error
      );

      setError(
        error.message
      );

    }

  };


  // MARK ALL AS READ

  const markAllAsRead = async () => {

    try {

      const unread =
        notifications.filter(
          (notification) =>
            notification.read !== true
        );

      for (
        const notification of unread
      ) {

        await updateDoc(
          doc(
            db,
            "notifications",
            notification.id
          ),
          {
            read: true
          }
        );

      }

    } catch (error) {

      console.error(
        "Mark all as read error:",
        error
      );

      setError(
        error.message
      );

    }

  };


  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.read !== true
    ).length;


  const formatDate = (timestamp) => {

    if (!timestamp) {
      return "";
    }

    if (
      typeof timestamp.toDate ===
      "function"
    ) {

      return timestamp
        .toDate()
        .toLocaleString();

    }

    return "";

  };


  if (loading) {

    return (
      <section className="notifications-section">

        <div className="section-header">

          <div>

            <h2>
              🔔 Notifications
            </h2>

            <p>
              Stay updated about your
              donations and requests.
            </p>

          </div>

        </div>

        <div className="notification-loading">
          Loading notifications...
        </div>

      </section>
    );

  }


  return (
    <section className="notifications-section">

      <div className="section-header">

        <div>

          <h2>

            🔔 Notifications

            {unreadCount > 0 && (

              <span className="notification-count">
                {unreadCount}
              </span>

            )}

          </h2>

          <p>
            Stay updated about your
            donations and requests.
          </p>

        </div>


        {unreadCount > 0 && (

          <button
            className="btn-secondary"
            onClick={markAllAsRead}
          >
            ✓ Mark All Read
          </button>

        )}

      </div>


      {error && (

        <div className="alert alert-error">
          ⚠️ {error}
        </div>

      )}


      {!error &&
        notifications.length === 0 && (

          <div className="notification-empty">

            <div className="notification-empty-icon">
              🔔
            </div>

            <h3>
              No notifications yet
            </h3>

            <p>
              New updates about requests,
              volunteers and deliveries
              will appear here.
            </p>

          </div>

        )}


      {notifications.length > 0 && (

        <div className="notification-list">

          {notifications.map(
            (notification) => (

              <div
                key={notification.id}
                className={`notification-item ${
                  notification.read !== true
                    ? "unread"
                    : ""
                }`}
              >

                <div className="notification-content">

                  <div className="notification-title-row">

                    <h3>
                      {notification.title}
                    </h3>

                    {notification.read !==
                      true && (

                      <span className="unread-dot">
                        NEW
                      </span>

                    )}

                  </div>

                  <p>
                    {notification.message}
                  </p>

                  {notification.createdAt && (

                    <small>
                      {formatDate(
                        notification.createdAt
                      )}
                    </small>

                  )}

                </div>


                {notification.read !==
                  true && (

                  <button
                    className="notification-read-btn"
                    onClick={() =>
                      markAsRead(
                        notification.id
                      )
                    }
                  >
                    ✓
                  </button>

                )}

              </div>

            )
          )}

        </div>

      )}

    </section>
  );
}

export default Notifications;