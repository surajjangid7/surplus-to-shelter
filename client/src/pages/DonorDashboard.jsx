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

function DonorDashboard() {
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      // =====================================
      // LOAD DONATIONS
      // =====================================

      const donationQuery = query(
        collection(db, "donations"),
        where("donorId", "==", user.uid)
      );

      const donationSnapshot =
        await getDocs(donationQuery);

      const donationList =
        donationSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

      setDonations(donationList);

      // =====================================
      // LOAD REQUESTS
      // =====================================

      const requestSnapshot =
        await getDocs(
          collection(db, "requests")
        );

      const requestList =
        requestSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

      const myDonationIds =
        donationList.map(
          (donation) => donation.id
        );

      const myRequests =
        requestList.filter(
          (request) =>
            myDonationIds.includes(
              request.donationId
            )
        );

      setRequests(myRequests);

    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      setError(error.message);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================
  // ACCEPT REQUEST
  // =====================================

  const acceptRequest = async (
    request
  ) => {
    try {
      setError("");

      const donation = donations.find(
        (item) =>
          item.id === request.donationId
      );

      if (!donation) {
        throw new Error(
          "Donation not found."
        );
      }

      if (
        donation.status !==
        "AVAILABLE"
      ) {
        throw new Error(
          "This donation is no longer available."
        );
      }

      // Generate 4 digit OTP
      const otp =
        Math.floor(
          1000 +
          Math.random() * 9000
        ).toString();

      // Update request
      await updateDoc(
        doc(
          db,
          "requests",
          request.id
        ),
        {
          status: "ACCEPTED",
          acceptedAt:
            serverTimestamp()
        }
      );

      // Update donation
      await updateDoc(
        doc(
          db,
          "donations",
          donation.id
        ),
        {
          status: "REQUESTED",

          // IMPORTANT
          shelterId:
            request.shelterId,

          deliveryOtp: otp,

          acceptedAt:
            serverTimestamp()
        }
      );

      // Notify shelter
      await createNotification({
        userId:
          request.shelterId,

        title:
          "✅ Donation Request Accepted",

        message:
          `Your request for "${donation.title}" has been accepted by the donor.`,

        type:
          "REQUEST_ACCEPTED"
      });

      alert(
        `Request accepted!\n\nDelivery OTP: ${otp}`
      );

      await loadDashboard();

    } catch (error) {
      console.error(
        "Accept request error:",
        error
      );

      setError(error.message);
    }
  };

  // =====================================
  // REJECT REQUEST
  // =====================================

  const rejectRequest = async (
    request
  ) => {
    try {
      setError("");

      const donation = donations.find(
        (item) =>
          item.id === request.donationId
      );

      if (!donation) {
        throw new Error(
          "Donation not found."
        );
      }

      await updateDoc(
        doc(
          db,
          "requests",
          request.id
        ),
        {
          status: "REJECTED",
          rejectedAt:
            serverTimestamp()
        }
      );

      await updateDoc(
        doc(
          db,
          "donations",
          donation.id
        ),
        {
          status: "AVAILABLE"
        }
      );

      // Notify shelter
      await createNotification({
        userId:
          request.shelterId,

        title:
          "❌ Donation Request Rejected",

        message:
          `Your request for "${donation.title}" was rejected by the donor.`,

        type:
          "REQUEST_REJECTED"
      });

      await loadDashboard();

    } catch (error) {
      console.error(
        "Reject request error:",
        error
      );

      setError(error.message);
    }
  };

  // =====================================
  // REFRESH
  // =====================================

  const refresh = async () => {
    setRefreshing(true);

    await loadDashboard();
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>

        <p>
          Loading donor dashboard...
        </p>
      </div>
    );
  }

  // =====================================
  // STATS
  // =====================================

  const availableCount =
    donations.filter(
      (donation) =>
        donation.status ===
        "AVAILABLE"
    ).length;

  const activeCount =
    donations.filter(
      (donation) =>
        donation.status !==
          "AVAILABLE" &&
        donation.status !==
          "COMPLETED"
    ).length;

  const completedCount =
    donations.filter(
      (donation) =>
        donation.status ===
        "COMPLETED"
    ).length;

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status ===
        "PENDING"
    ).length;

  // =====================================
  // MAIN
  // =====================================

  return (
    <div className="dashboard-container">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="dashboard-header">

        <h1>
          🎁 Donor Dashboard
        </h1>

        <p>
          Turn your surplus into meaningful
          support for people who need it.
        </p>

      </div>

      {/* ================================= */}
      {/* ERROR */}
      {/* ================================= */}

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {/* ================================= */}
      {/* STATS */}
      {/* ================================= */}

      <div className="stats-grid">

        <div className="stat-card">
          <h3>
            Total Donations
          </h3>

          <strong>
            {donations.length}
          </strong>
        </div>

        <div className="stat-card">
          <h3>
            Available
          </h3>

          <strong>
            {availableCount}
          </strong>
        </div>

        <div className="stat-card">
          <h3>
            Active
          </h3>

          <strong>
            {activeCount}
          </strong>
        </div>

        <div className="stat-card">
          <h3>
            Completed
          </h3>

          <strong>
            {completedCount}
          </strong>
        </div>

        <div className="stat-card">
          <h3>
            Pending Requests
          </h3>

          <strong>
            {pendingRequests}
          </strong>
        </div>

      </div>

      {/* ================================= */}
      {/* ACTIONS */}
      {/* ================================= */}

      <div className="button-group">

        <button
          onClick={() =>
            navigate(
              "/donor/add-donation"
            )
          }
        >
          ➕ Add Donation
        </button>

        <button
          className="btn-secondary"
          onClick={() =>
            navigate("/impact")
          }
        >
          📊 Community Impact
        </button>

        <button
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "🔄 Refresh"}
        </button>

      </div>

      <hr />

      {/* ================================= */}
      {/* NOTIFICATIONS */}
      {/* ================================= */}

      <Notifications />

      <hr />

      {/* ================================= */}
      {/* REQUESTS */}
      {/* ================================= */}

      <div className="section-header">

        <div>
          <h2>
            🤝 Donation Requests
          </h2>

          <p>
            Review requests from shelters.
          </p>
        </div>

      </div>

      {requests.length === 0 ? (

        <div className="empty-state">

          <div className="empty-state-icon">
            📭
          </div>

          <h3>
            No requests yet
          </h3>

          <p>
            Shelter requests will appear
            here when someone needs your
            surplus.
          </p>

        </div>

      ) : (

        requests.map((request) => {

          const donation =
            donations.find(
              (item) =>
                item.id ===
                request.donationId
            );

          if (!donation) {
            return null;
          }

          return (
            <div
              className="card"
              key={request.id}
            >

              <div className="section-header">

                <div>
                  <h3>
                    {donation.title}
                  </h3>

                  <p>
                    {donation.itemType}
                    {" • "}
                    {donation.quantity}{" "}
                    {donation.unit}
                  </p>
                </div>

                {request.status ===
                  "PENDING" && (

                  <span className="badge badge-warning">
                    ⏳ Pending
                  </span>

                )}

                {request.status ===
                  "ACCEPTED" && (

                  <span className="badge badge-success">
                    ✅ Accepted
                  </span>

                )}

                {request.status ===
                  "REJECTED" && (

                  <span className="badge badge-danger">
                    ❌ Rejected
                  </span>

                )}

              </div>

              {request.message && (
                <div className="alert alert-info">
                  <strong>
                    Shelter message:
                  </strong>

                  <br />

                  {request.message}
                </div>
              )}

              <p>
                <strong>
                  Donation Status:
                </strong>{" "}

                {donation.status}
              </p>

              {request.status ===
                "PENDING" && (

                <div className="button-group">

                  <button
                    onClick={() =>
                      acceptRequest(
                        request
                      )
                    }
                  >
                    ✅ Accept Request
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() =>
                      rejectRequest(
                        request
                      )
                    }
                  >
                    ❌ Reject
                  </button>

                </div>

              )}

              {request.status ===
                "ACCEPTED" && (
                <div className="alert alert-success">
                  <strong>
                    ✅ Request Accepted
                  </strong>

                  <br />

                  Volunteer delivery is now
                  being arranged.
                </div>
              )}

            </div>
          );
        })

      )}

      <hr />

      {/* ================================= */}
      {/* MY DONATIONS */}
      {/* ================================= */}

      <div className="section-header">

        <div>
          <h2>
            📦 My Donations
          </h2>

          <p>
            Track all your surplus
            contributions.
          </p>
        </div>

      </div>

      {donations.length === 0 ? (

        <div className="empty-state">

          <div className="empty-state-icon">
            📦
          </div>

          <h3>
            No donations yet
          </h3>

          <p>
            Start by adding your first
            surplus donation.
          </p>

          <br />

          <button
            onClick={() =>
              navigate(
                "/donor/add-donation"
              )
            }
          >
            ➕ Add Donation
          </button>

        </div>

      ) : (

        donations.map(
          (donation) => (

            <div
              className="card"
              key={donation.id}
            >

              <div className="section-header">

                <div>
                  <h3>
                    {donation.title}
                  </h3>

                  <p>
                    {donation.itemType}
                  </p>
                </div>

                {donation.status ===
                  "AVAILABLE" && (
                  <span className="badge badge-success">
                    AVAILABLE
                  </span>
                )}

                {donation.status ===
                  "REQUESTED" && (
                  <span className="badge badge-warning">
                    REQUESTED
                  </span>
                )}

                {donation.status ===
                  "PICKUP_ASSIGNED" && (
                  <span className="badge badge-info">
                    PICKUP ASSIGNED
                  </span>
                )}

                {donation.status ===
                  "PICKED_UP" && (
                  <span className="badge badge-info">
                    PICKED UP
                  </span>
                )}

                {donation.status ===
                  "OUT_FOR_DELIVERY" && (
                  <span className="badge badge-warning">
                    OUT FOR DELIVERY
                  </span>
                )}

                {donation.status ===
                  "COMPLETED" && (
                  <span className="badge badge-success">
                    COMPLETED
                  </span>
                )}

              </div>

              <div className="card-grid">

                <div>
                  <strong>
                    Quantity
                  </strong>

                  <p>
                    {donation.quantity}{" "}
                    {donation.unit}
                  </p>
                </div>

                <div>
                  <strong>
                    Address
                  </strong>

                  <p>
                    {donation.address}
                  </p>
                </div>

                {donation.expiryTime && (
                  <div>
                    <strong>
                      Expiry
                    </strong>

                    <p>
                      {donation.expiryTime}
                    </p>
                  </div>
                )}

              </div>

              {donation.description && (
                <p>
                  <strong>
                    Description:
                  </strong>{" "}
                  {donation.description}
                </p>
              )}

              {donation.latitude != null &&
                donation.longitude != null && (

                <p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${donation.latitude},${donation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📍 Open Pickup Location
                  </a>
                </p>

              )}

              {donation.status ===
                "REQUESTED" &&
                donation.deliveryOtp && (

                <div className="alert alert-warning">

                  <strong>
                    🔐 Delivery OTP
                  </strong>

                  <br />

                  Give this OTP to the
                  volunteer when the donation
                  is delivered.

                  <h2
                    style={{
                      marginTop: "8px",
                      letterSpacing:
                        "5px"
                    }}
                  >
                    {donation.deliveryOtp}
                  </h2>

                </div>

              )}

            </div>

          )
        )

      )}

    </div>
  );
}

export default DonorDashboard;