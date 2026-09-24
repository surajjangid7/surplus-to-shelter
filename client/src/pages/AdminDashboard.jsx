import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import db from "../firebase/firestore";
import { auth } from "../firebase/auth";

function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      console.log("Logged-in Admin UID:", user.uid);

      // =====================================
      // CHECK ADMIN PROFILE
      // =====================================

      const adminRef = doc(
        db,
        "users",
        user.uid
      );

      const adminSnapshot = await getDoc(
        adminRef
      );

      if (!adminSnapshot.exists()) {
        throw new Error(
          "Admin profile not found in Firestore."
        );
      }

      const adminData =
        adminSnapshot.data();

      console.log(
        "Admin profile:",
        adminData
      );

      if (adminData.role !== "ADMIN") {
        throw new Error(
          "This account does not have ADMIN privileges."
        );
      }

      // =====================================
      // LOAD USERS
      // =====================================

      console.log(
        "Loading users..."
      );

      const usersSnapshot =
        await getDocs(
          collection(db, "users")
        );

      const userList =
        usersSnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );

      setUsers(userList);

      console.log(
        "Users loaded:",
        userList.length
      );

      // =====================================
      // LOAD DONATIONS
      // =====================================

      console.log(
        "Loading donations..."
      );

      const donationsSnapshot =
        await getDocs(
          collection(db, "donations")
        );

      const donationList =
        donationsSnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );

      setDonations(donationList);

      console.log(
        "Donations loaded:",
        donationList.length
      );

      // =====================================
      // LOAD REQUESTS
      // =====================================

      console.log(
        "Loading requests..."
      );

      const requestsSnapshot =
        await getDocs(
          collection(db, "requests")
        );

      const requestList =
        requestsSnapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );

      setRequests(requestList);

      console.log(
        "Requests loaded:",
        requestList.length
      );

    } catch (error) {
      console.error(
        "ADMIN FIRESTORE ERROR:",
        error
      );

      if (
        error.code ===
        "permission-denied"
      ) {
        setError(
          "Missing or insufficient permissions. Make sure this account has role: ADMIN in Firestore and that your Firestore rules are published."
        );
      } else {
        setError(
          error.message
        );
      }

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // =====================================
  // VERIFY USER
  // =====================================

  const verifyUser = async (userId) => {
    try {
      setError("");

      await updateDoc(
        doc(db, "users", userId),
        {
          verified: true
        }
      );

      await loadAdminData();

    } catch (error) {
      console.error(
        "Verification error:",
        error
      );

      if (
        error.code ===
        "permission-denied"
      ) {
        setError(
          "You do not have permission to verify this user."
        );
      } else {
        setError(
          error.message
        );
      }
    }
  };


  // =====================================
  // REFRESH
  // =====================================

  const refresh = async () => {
    setRefreshing(true);
    await loadAdminData();
  };


  // =====================================
  // STATISTICS
  // =====================================

  const donors =
    users.filter(
      (user) =>
        user.role === "DONOR"
    ).length;

  const shelters =
    users.filter(
      (user) =>
        user.role === "SHELTER"
    ).length;

  const volunteers =
    users.filter(
      (user) =>
        user.role === "VOLUNTEER"
    ).length;

  const admins =
    users.filter(
      (user) =>
        user.role === "ADMIN"
    ).length;

  const pendingUsers =
    users.filter(
      (user) =>
        user.role !== "ADMIN" &&
        user.verified !== true
    ).length;

  const completedDeliveries =
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
  // STATUS CLASS
  // =====================================

  const getStatusClass = (status) => {
    switch (status) {

      case "AVAILABLE":
        return "status-available";

      case "REQUESTED":
        return "status-requested";

      case "PICKUP_ASSIGNED":
        return "status-assigned";

      case "PICKED_UP":
        return "status-picked";

      case "OUT_FOR_DELIVERY":
        return "status-transit";

      case "COMPLETED":
        return "status-completed";

      case "ACCEPTED":
        return "status-completed";

      case "REJECTED":
        return "status-error";

      default:
        return "";
    }
  };


  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="dashboard-container">

        <div className="dashboard-header">

          <div>

            <p className="eyebrow">
              SURPLUS TO SHELTER
            </p>

            <h1>
              🛡️ Admin Dashboard
            </h1>

            <p>
              Loading platform management
              data...
            </p>

          </div>

        </div>

        <div className="loading-container">

          <div className="loading-spinner"></div>

          <p>
            Loading admin dashboard...
          </p>

        </div>

      </div>
    );
  }


  // =====================================
  // MAIN DASHBOARD
  // =====================================

  return (
    <div className="dashboard-container">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>

          <p className="eyebrow">
            SURPLUS TO SHELTER
          </p>

          <h1>
            🛡️ Admin Dashboard
          </h1>

          <p>
            Manage users, donations,
            requests and platform verification.
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


      {/* PLATFORM STATISTICS */}

      <div className="section-header">

        <div>

          <h2>
            📊 Platform Statistics
          </h2>

          <p>
            Overview of the Surplus to
            Shelter platform.
          </p>

        </div>

      </div>


      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            👤
          </div>

          <div>

            <h3>
              {donors}
            </h3>

            <p>
              Donors
            </p>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🏠
          </div>

          <div>

            <h3>
              {shelters}
            </h3>

            <p>
              Shelters
            </p>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🚚
          </div>

          <div>

            <h3>
              {volunteers}
            </h3>

            <p>
              Volunteers
            </p>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🛡️
          </div>

          <div>

            <h3>
              {admins}
            </h3>

            <p>
              Admins
            </p>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🎁
          </div>

          <div>

            <h3>
              {donations.length}
            </h3>

            <p>
              Total Donations
            </p>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🎉
          </div>

          <div>

            <h3>
              {completedDeliveries}
            </h3>

            <p>
              Completed
            </p>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🤝
          </div>

          <div>

            <h3>
              {pendingRequests}
            </h3>

            <p>
              Pending Requests
            </p>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            ⏳
          </div>

          <div>

            <h3>
              {pendingUsers}
            </h3>

            <p>
              Pending Verification
            </p>

          </div>

        </div>

      </div>


      {/* USER VERIFICATION */}

      <div className="section-header">

        <div>

          <h2>
            👥 User Verification
          </h2>

          <p>
            Review and verify newly registered
            users.
          </p>

        </div>


        {pendingUsers > 0 && (

          <span className="badge badge-warning">
            {pendingUsers} Pending
          </span>

        )}

      </div>


      {users.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            👥
          </div>

          <h3>
            No users found
          </h3>

        </div>

      ) : (

        <div className="card-grid">

          {users.map((user) => (

            <div
              className="card"
              key={user.id}
            >

              <div className="card-top">

                <div>

                  <h3>
                    {user.name ||
                      "Unnamed User"}
                  </h3>

                  <span className="info-label">
                    {user.role}
                  </span>

                </div>


                {user.role === "ADMIN" ? (

                  <span className="badge badge-info">
                    🛡️ Admin
                  </span>

                ) : user.verified === true ? (

                  <span className="badge badge-success">
                    ✅ Verified
                  </span>

                ) : (

                  <span className="badge badge-warning">
                    ⏳ Pending
                  </span>

                )}

              </div>


              <div className="info-grid">

                <div>

                  <span className="info-label">
                    Email
                  </span>

                  <strong>
                    {user.email ||
                      "Not available"}
                  </strong>

                </div>


                <div>

                  <span className="info-label">
                    Phone
                  </span>

                  <strong>
                    {user.phone ||
                      "Not available"}
                  </strong>

                </div>

              </div>


              {user.organization && (

                <div className="description-box">

                  <span className="info-label">
                    Organization
                  </span>

                  <p>
                    {user.organization}
                  </p>

                </div>

              )}


              {user.role !== "ADMIN" &&
                user.verified !== true && (

                  <button
                    className="btn-primary full-width"
                    onClick={() =>
                      verifyUser(user.id)
                    }
                  >
                    ✅ Verify User
                  </button>

                )}

            </div>

          ))}

        </div>

      )}


      {/* DONATIONS */}

      <div className="section-header">

        <div>

          <h2>
            📦 Donations
          </h2>

          <p>
            Monitor surplus resources
            across the platform.
          </p>

        </div>


        <span className="badge badge-info">
          {donations.length} Total
        </span>

      </div>


      {donations.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            📦
          </div>

          <h3>
            No donations found
          </h3>

        </div>

      ) : (

        <div className="card-grid">

          {donations.map(
            (donation) => (

              <div
                className="card donation-card"
                key={donation.id}
              >

                <div className="card-top">

                  <div>

                    <h3>
                      {donation.title}
                    </h3>

                    <span className="info-label">
                      {donation.itemType}
                    </span>

                  </div>


                  <span
                    className={`status-badge ${getStatusClass(
                      donation.status
                    )}`}
                  >
                    {donation.status}
                  </span>

                </div>


                <div className="info-grid">

                  <div>

                    <span className="info-label">
                      Quantity
                    </span>

                    <strong>
                      {donation.quantity}{" "}
                      {donation.unit}
                    </strong>

                  </div>


                  <div>

                    <span className="info-label">
                      Donor ID
                    </span>

                    <strong className="truncate-text">
                      {donation.donorId ||
                        "N/A"}
                    </strong>

                  </div>

                </div>


                {donation.shelterId && (

                  <div className="description-box">

                    <span className="info-label">
                      Shelter
                    </span>

                    <p className="truncate-text">
                      {donation.shelterId}
                    </p>

                  </div>

                )}


                {donation.volunteerId && (

                  <div className="description-box">

                    <span className="info-label">
                      Volunteer
                    </span>

                    <p className="truncate-text">
                      {donation.volunteerId}
                    </p>

                  </div>

                )}

              </div>

            )
          )}

        </div>

      )}


      {/* REQUESTS */}

      <div className="section-header">

        <div>

          <h2>
            🤝 Donation Requests
          </h2>

          <p>
            Monitor requests submitted
            by shelters.
          </p>

        </div>


        <span className="badge badge-info">
          {requests.length} Total
        </span>

      </div>


      {requests.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            🤝
          </div>

          <h3>
            No requests found
          </h3>

        </div>

      ) : (

        <div className="card-grid">

          {requests.map(
            (request) => (

              <div
                className="card"
                key={request.id}
              >

                <div className="card-top">

                  <h3>
                    Donation Request
                  </h3>


                  <span
                    className={`status-badge ${
                      request.status ===
                      "PENDING"
                        ? "status-requested"
                        : request.status ===
                          "ACCEPTED"
                        ? "status-completed"
                        : "status-error"
                    }`}
                  >
                    {request.status}
                  </span>

                </div>


                <div className="info-grid">

                  <div>

                    <span className="info-label">
                      Donation ID
                    </span>

                    <strong className="truncate-text">
                      {request.donationId}
                    </strong>

                  </div>


                  <div>

                    <span className="info-label">
                      Shelter ID
                    </span>

                    <strong className="truncate-text">
                      {request.shelterId}
                    </strong>

                  </div>

                </div>


                {request.message && (

                  <div className="description-box">

                    <span className="info-label">
                      Message
                    </span>

                    <p>
                      {request.message}
                    </p>

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
          className="btn-primary"
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

export default AdminDashboard;