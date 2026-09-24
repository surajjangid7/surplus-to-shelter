import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth } from "../firebase/auth";
import db from "../firebase/firestore";

import { createNotification } from "../services/notificationService";
import Notifications from "../components/Notifications";

function VolunteerDashboard() {
  const navigate = useNavigate();

  const [availableDeliveries, setAvailableDeliveries] =
    useState([]);

  const [myDeliveries, setMyDeliveries] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      // AVAILABLE DELIVERIES
      const availableQuery = query(
        collection(db, "donations"),
        where("status", "==", "REQUESTED")
      );

      const availableSnapshot =
        await getDocs(availableQuery);

      const available =
        availableSnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );

      setAvailableDeliveries(
        available.filter(
          (donation) =>
            !donation.volunteerId
        )
      );

      // MY DELIVERIES
      const myQuery = query(
        collection(db, "donations"),
        where(
          "volunteerId",
          "==",
          user.uid
        )
      );

      const mySnapshot =
        await getDocs(myQuery);

      const mine =
        mySnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );

      setMyDeliveries(mine);

    } catch (error) {
      console.error(
        "Error loading deliveries:",
        error
      );

      setError(error.message);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // ACCEPT DELIVERY
  const acceptDelivery = async (
    donationId
  ) => {
    try {
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      const donationRef = doc(
        db,
        "donations",
        donationId
      );

      const donationSnapshot =
        await getDocs(
          query(
            collection(db, "donations"),
            where(
              "__name__",
              "==",
              donationId
            )
          )
        );

      if (donationSnapshot.empty) {
        throw new Error(
          "Donation not found."
        );
      }

      const donation =
        donationSnapshot.docs[0].data();

      if (!donation.shelterId) {
        throw new Error(
          "Shelter information is missing from this donation."
        );
      }

      await updateDoc(
        donationRef,
        {
          volunteerId: user.uid,
          status: "PICKUP_ASSIGNED",
          assignedAt: serverTimestamp()
        }
      );

      await createNotification({
        userId: donation.shelterId,
        title: "🚚 Volunteer Assigned",
        message: `A volunteer has accepted delivery for "${donation.title}".`,
        type: "VOLUNTEER_ASSIGNED"
      });

      alert(
        "✅ Delivery accepted!"
      );

      await loadDeliveries();

    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };


  // UPDATE DELIVERY STATUS
  const updateDeliveryStatus = async (
    donationId,
    status
  ) => {
    try {
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      const donationRef = doc(
        db,
        "donations",
        donationId
      );

      const donationSnapshot =
        await getDocs(
          query(
            collection(db, "donations"),
            where(
              "__name__",
              "==",
              donationId
            )
          )
        );

      if (donationSnapshot.empty) {
        throw new Error(
          "Donation not found."
        );
      }

      const donation =
        donationSnapshot.docs[0].data();

      if (
        donation.volunteerId !==
        user.uid
      ) {
        throw new Error(
          "This delivery is not assigned to you."
        );
      }

      const updates = {
        status
      };

      if (status === "PICKED_UP") {
        updates.pickedUpAt =
          serverTimestamp();
      }

      if (
        status === "OUT_FOR_DELIVERY"
      ) {
        updates.outForDeliveryAt =
          serverTimestamp();
      }

      await updateDoc(
        donationRef,
        updates
      );

      // Notify shelter
      if (donation.shelterId) {

        if (status === "PICKED_UP") {
          await createNotification({
            userId: donation.shelterId,
            title:
              "📦 Donation Picked Up",
            message:
              `The volunteer has picked up "${donation.title}".`,
            type:
              "DONATION_PICKED_UP"
          });
        }

        if (
          status === "OUT_FOR_DELIVERY"
        ) {
          await createNotification({
            userId: donation.shelterId,
            title:
              "🚚 Donation Out for Delivery",
            message:
              `"${donation.title}" is now on the way to your shelter.`,
            type:
              "OUT_FOR_DELIVERY"
          });
        }
      }

      await loadDeliveries();

    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };


  const refresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
  };


  // STATISTICS
  const assignedCount =
    myDeliveries.filter(
      (item) =>
        item.status ===
        "PICKUP_ASSIGNED"
    ).length;

  const inTransitCount =
    myDeliveries.filter(
      (item) =>
        item.status === "PICKED_UP" ||
        item.status ===
          "OUT_FOR_DELIVERY"
    ).length;

  const completedCount =
    myDeliveries.filter(
      (item) =>
        item.status === "COMPLETED"
    ).length;


  const getStatusClass = (status) => {
    switch (status) {
      case "PICKUP_ASSIGNED":
        return "status-assigned";

      case "PICKED_UP":
        return "status-picked";

      case "OUT_FOR_DELIVERY":
        return "status-transit";

      case "COMPLETED":
        return "status-completed";

      default:
        return "";
    }
  };


  const getStatusText = (status) => {
    switch (status) {
      case "PICKUP_ASSIGNED":
        return "Pickup Assigned";

      case "PICKED_UP":
        return "Picked Up";

      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";

      case "COMPLETED":
        return "Completed";

      default:
        return status;
    }
  };


  if (loading) {
    return (
      <div className="dashboard-container">

        <div className="dashboard-header">
          <div>
            <p className="eyebrow">
              SURPLUS TO SHELTER
            </p>

            <h1>
              🚚 Volunteer Dashboard
            </h1>

            <p>
              Loading your delivery network...
            </p>
          </div>
        </div>

        <Notifications />

        <div className="loading-container">
          <div className="loading-spinner"></div>

          <p>
            Loading deliveries...
          </p>
        </div>

      </div>
    );
  }


  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header">

        <div>
          <p className="eyebrow">
            SURPLUS TO SHELTER
          </p>

          <h1>
            🚚 Volunteer Dashboard
          </h1>

          <p>
            Help deliver surplus resources
            safely to shelters.
          </p>
        </div>

        <div className="button-group">

          <button
            className="btn-secondary"
            onClick={() =>
              navigate("/impact")
            }
          >
            📊 Community Impact
          </button>

          <button
            className="btn-primary"
            onClick={refresh}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "🔄 Refresh"}
          </button>

        </div>

      </div>


      {/* ERROR */}
      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}


      {/* STATS */}
      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            📦
          </div>

          <div>
            <h3>
              {availableDeliveries.length}
            </h3>

            <p>
              Available Pickups
            </p>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🚚
          </div>

          <div>
            <h3>
              {assignedCount}
            </h3>

            <p>
              Assigned Deliveries
            </p>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🛣️
          </div>

          <div>
            <h3>
              {inTransitCount}
            </h3>

            <p>
              In Progress
            </p>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🎉
          </div>

          <div>
            <h3>
              {completedCount}
            </h3>

            <p>
              Completed
            </p>
          </div>

        </div>

      </div>


      {/* NOTIFICATIONS */}
      <Notifications />


      {/* AVAILABLE DELIVERIES */}
      <div className="section-header">

        <div>
          <h2>
            📦 Available Deliveries
          </h2>

          <p>
            These donations are waiting for
            a volunteer to accept the delivery.
          </p>
        </div>

      </div>


      {availableDeliveries.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            🚚
          </div>

          <h3>
            No deliveries available
          </h3>

          <p>
            There are currently no donations
            waiting for a volunteer.
          </p>

          <button
            className="btn-primary"
            onClick={refresh}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "🔄 Check Again"}
          </button>

        </div>

      ) : (

        <div className="card-grid">

          {availableDeliveries.map(
            (donation) => (

              <div
                className="card donation-card"
                key={donation.id}
              >

                <div className="card-top">

                  <div>
                    <span className="rank-badge">
                      PICKUP
                    </span>
                  </div>

                  <span className="badge badge-warning">
                    REQUESTED
                  </span>

                </div>


                <h2 className="donation-title">
                  {donation.title}
                </h2>


                <div className="info-grid">

                  <div>
                    <span className="info-label">
                      Item Type
                    </span>

                    <strong>
                      {donation.itemType}
                    </strong>
                  </div>


                  <div>
                    <span className="info-label">
                      Quantity
                    </span>

                    <strong>
                      {donation.quantity}{" "}
                      {donation.unit}
                    </strong>
                  </div>

                </div>


                {donation.description && (
                  <div className="description-box">

                    <span className="info-label">
                      Description
                    </span>

                    <p>
                      {donation.description}
                    </p>

                  </div>
                )}


                <div className="address-box">

                  <span className="info-label">
                    Pickup Location
                  </span>

                  <p>
                    📍{" "}
                    {donation.address ||
                      "Address not provided"}
                  </p>

                </div>


                {donation.latitude != null &&
                  donation.longitude != null && (

                    <a
                      className="map-link"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${donation.latitude},${donation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📍 Open Pickup Location
                    </a>

                  )}


                <button
                  className="btn-primary full-width"
                  onClick={() =>
                    acceptDelivery(
                      donation.id
                    )
                  }
                >
                  🚚 Accept Delivery
                </button>

              </div>

            )
          )}

        </div>

      )}


      {/* MY DELIVERIES */}
      <div className="section-header">

        <div>
          <h2>
            🚚 My Deliveries
          </h2>

          <p>
            Track and update your assigned
            deliveries.
          </p>
        </div>

      </div>


      {myDeliveries.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            📦
          </div>

          <h3>
            No assigned deliveries
          </h3>

          <p>
            Accept an available delivery
            to see it here.
          </p>

        </div>

      ) : (

        <div className="card-grid">

          {myDeliveries.map(
            (donation) => (

              <div
                className="card donation-card"
                key={donation.id}
              >

                <div className="card-top">

                  <span className="info-label">
                    DELIVERY
                  </span>

                  <span
                    className={`status-badge ${getStatusClass(
                      donation.status
                    )}`}
                  >
                    {getStatusText(
                      donation.status
                    )}
                  </span>

                </div>


                <h2 className="donation-title">
                  {donation.title}
                </h2>


                <div className="info-grid">

                  <div>
                    <span className="info-label">
                      Item Type
                    </span>

                    <strong>
                      {donation.itemType}
                    </strong>
                  </div>


                  <div>
                    <span className="info-label">
                      Quantity
                    </span>

                    <strong>
                      {donation.quantity}{" "}
                      {donation.unit}
                    </strong>
                  </div>

                </div>


                <div className="address-box">

                  <span className="info-label">
                    Pickup Location
                  </span>

                  <p>
                    📍{" "}
                    {donation.address ||
                      "Address not provided"}
                  </p>

                </div>


                {donation.latitude != null &&
                  donation.longitude != null && (

                    <a
                      className="map-link"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${donation.latitude},${donation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📍 Navigate to Pickup
                    </a>

                  )}


                {/* PICKUP ASSIGNED */}
                {donation.status ===
                  "PICKUP_ASSIGNED" && (

                  <div className="action-panel">

                    <div className="alert alert-info">
                      📦 Go to the pickup location
                      and collect the donation.
                    </div>

                    <button
                      className="btn-primary full-width"
                      onClick={() =>
                        updateDeliveryStatus(
                          donation.id,
                          "PICKED_UP"
                        )
                      }
                    >
                      📦 Mark as Picked Up
                    </button>

                  </div>

                )}


                {/* PICKED UP */}
                {donation.status ===
                  "PICKED_UP" && (

                  <div className="action-panel">

                    <div className="alert alert-success">
                      ✓ Donation collected.
                      Take it to the shelter.
                    </div>

                    <button
                      className="btn-primary full-width"
                      onClick={() =>
                        updateDeliveryStatus(
                          donation.id,
                          "OUT_FOR_DELIVERY"
                        )
                      }
                    >
                      🚚 Start Delivery
                    </button>

                  </div>

                )}


                {/* OUT FOR DELIVERY */}
                {donation.status ===
                  "OUT_FOR_DELIVERY" && (

                  <div className="action-panel">

                    <div className="alert alert-warning">
                      🚚 Delivery is currently
                      in progress.
                    </div>

                    <button
                      className="btn-primary full-width"
                      onClick={() =>
                        navigate(
                          `/volunteer/verify/${donation.id}`
                        )
                      }
                    >
                      🔐 Verify Delivery
                    </button>

                  </div>

                )}


                {/* COMPLETED */}
                {donation.status ===
                  "COMPLETED" && (

                  <div className="alert alert-success">
                    🎉 Delivery Completed
                  </div>

                )}

              </div>

            )
          )}

        </div>

      )}


      {/* FOOTER ACTIONS */}
      <div className="center-actions">

        <button
          className="btn-secondary"
          onClick={() =>
            navigate("/impact")
          }
        >
          📊 View Community Impact
        </button>

        <button
          className="btn-secondary"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "🔄 Refresh Dashboard"}
        </button>

      </div>

    </div>
  );
}

export default VolunteerDashboard;