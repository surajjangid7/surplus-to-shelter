import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "firebase/firestore";

import { auth } from "../firebase/auth";
import db from "../firebase/firestore";

import Notifications from "../components/Notifications";

import {
  getMatchDetails
} from "../services/matchingService";

function ShelterDashboard() {
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [shelter, setShelter] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      // GET SHELTER PROFILE
      const shelterRef = doc(
        db,
        "users",
        user.uid
      );

      const shelterDoc = await getDoc(
        shelterRef
      );

      if (!shelterDoc.exists()) {
        throw new Error(
          "Shelter profile not found."
        );
      }

      const shelterData =
        shelterDoc.data();

      setShelter(shelterData);

      // GET AVAILABLE DONATIONS
      const donationQuery = query(
        collection(db, "donations"),
        where(
          "status",
          "==",
          "AVAILABLE"
        )
      );

      const snapshot =
        await getDocs(donationQuery);

      const donationList =
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

      // CALCULATE SMART MATCHES
      const matchedDonations =
        donationList.map((donation) => {
          const matchDetails =
            getMatchDetails(
              donation,
              shelterData
            );

          return {
            ...donation,

            matchScore:
              matchDetails.score,

            distance:
              matchDetails.distance,

            hoursLeft:
              matchDetails.hoursLeft,

            matchReasons:
              matchDetails.reasons
          };
        });

      // BEST MATCH FIRST
      matchedDonations.sort(
        (a, b) =>
          b.matchScore -
          a.matchScore
      );

      setDonations(
        matchedDonations
      );

    } catch (error) {
      console.error(
        "Shelter dashboard error:",
        error
      );

      if (
        error.code ===
        "permission-denied"
      ) {
        setError(
          "Missing or insufficient permissions. Please make sure your shelter account is verified and Firestore rules are published."
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

  const refreshMatches = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "match-score-high";
    }

    if (score >= 50) {
      return "match-score-medium";
    }

    return "match-score-low";
  };

  const requirementsIncomplete =
    !shelter?.requiredItemType ||
    !shelter?.requiredQuantity ||
    shelter?.latitude == null ||
    shelter?.longitude == null;

  if (loading) {
    return (
      <div className="dashboard-container">

        <div className="dashboard-header">

          <div>
            <p className="eyebrow">
              SURPLUS TO SHELTER
            </p>

            <h1>
              🏠 Shelter Dashboard
            </h1>

            <p>
              Find resources that match
              your shelter's needs.
            </p>
          </div>

        </div>

        <Notifications />

        <div className="loading-container">

          <div className="loading-spinner"></div>

          <p>
            🤖 Finding the best donations...
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
            🏠 Shelter Dashboard
          </h1>

          <p>
            Find surplus resources that best
            match your shelter's needs.
          </p>
        </div>

        <div className="button-group">

          <button
            className="btn-secondary"
            onClick={() =>
              navigate(
                "/shelter/profile"
              )
            }
          >
            ⚙️ Shelter Requirements
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
            className="btn-primary"
            onClick={refreshMatches}
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


      {/* NOTIFICATIONS */}

      <Notifications />


      {/* REQUIREMENTS */}

      <div className="section-header">

        <div>
          <h2>
            📋 Your Requirements
          </h2>

          <p>
            These requirements are used by
            the smart matching system.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={() =>
            navigate(
              "/shelter/profile"
            )
          }
        >
          ⚙️ Edit Requirements
        </button>

      </div>


      {shelter ? (

        <div className="requirements-card">

          <div className="requirements-grid">

            <div className="requirement-item">

              <span className="info-label">
                Organization
              </span>

              <strong>
                {shelter.organization ||
                  "Not set"}
              </strong>

            </div>


            <div className="requirement-item">

              <span className="info-label">
                Required Item
              </span>

              <strong>
                {shelter.requiredItemType ||
                  "Not set"}
              </strong>

            </div>


            <div className="requirement-item">

              <span className="info-label">
                Required Quantity
              </span>

              <strong>
                {shelter.requiredQuantity ||
                  "Not set"}
              </strong>

            </div>


            <div className="requirement-item">

              <span className="info-label">
                Location
              </span>

              <strong>
                {shelter.latitude != null &&
                shelter.longitude != null
                  ? "📍 Location Set"
                  : "⚠ Not Set"}
              </strong>

            </div>

          </div>


          {requirementsIncomplete ? (

            <div className="requirements-warning">
              ⚠️ Complete your shelter
              requirements for better matching.
            </div>

          ) : (

            <div className="requirements-complete">
              ✓ Your shelter requirements
              are complete.
            </div>

          )}

        </div>

      ) : (

        <div className="empty-state">

          <div className="empty-icon">
            📋
          </div>

          <h3>
            Set Your Requirements
          </h3>

          <p>
            Add your shelter's needs to
            improve smart matching.
          </p>

          <button
            className="btn-primary"
            onClick={() =>
              navigate(
                "/shelter/profile"
              )
            }
          >
            ⚙️ Set Requirements
          </button>

        </div>

      )}


      {/* SMART MATCHES */}

      <div className="section-header">

        <div>
          <h2>
            🤖 Smart Matches
          </h2>

          <p>
            Donations are ranked using
            item type, quantity, distance
            and urgency.
          </p>
        </div>

        {donations.length > 0 && (
          <span className="badge badge-info">
            {donations.length} Available
          </span>
        )}

      </div>


      {/* NO DONATIONS */}

      {donations.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            📦
          </div>

          <h3>
            No Available Donations
          </h3>

          <p>
            There are currently no available
            donations.
          </p>

          <button
            className="btn-primary"
            onClick={refreshMatches}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "🔄 Check Again"}
          </button>

        </div>

      ) : (

        <div className="card-grid">

          {donations.map(
            (donation, index) => (

              <div
                className="card donation-card"
                key={donation.id}
              >

                <div className="card-top">

                  <div>

                    <span className="rank-badge">
                      #{index + 1} MATCH
                    </span>

                    <h2 className="donation-title">
                      {donation.title}
                    </h2>

                  </div>

                  <div
                    className={`match-score ${getScoreClass(
                      donation.matchScore
                    )}`}
                  >
                    {donation.matchScore}/100
                  </div>

                </div>


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


                <div className="match-reasons">

                  <h3>
                    🤖 Why this is a match
                  </h3>

                  {donation.matchReasons?.map(
                    (reason, reasonIndex) => (

                      <p
                        key={reasonIndex}
                        className={
                          reason.startsWith("✓")
                            ? "reason-positive"
                            : reason.startsWith("⚠")
                            ? "reason-warning"
                            : "reason-negative"
                        }
                      >
                        {reason}
                      </p>

                    )
                  )}

                </div>


                {donation.distance !== null && (

                  <div className="match-detail">

                    <span className="info-label">
                      Distance
                    </span>

                    <strong>
                      📍{" "}
                      {donation.distance.toFixed(
                        1
                      )}{" "}
                      km
                    </strong>

                  </div>

                )}


                {donation.expiryTime && (

                  <div className="match-detail">

                    <span className="info-label">
                      Expiry / Best Before
                    </span>

                    <strong>
                      ⏰ {donation.expiryTime}
                    </strong>

                  </div>

                )}


                {donation.hoursLeft !== null &&
                  donation.hoursLeft > 0 &&
                  donation.hoursLeft <= 24 && (

                    <div
                      className={
                        donation.hoursLeft <= 6
                          ? "urgency-high"
                          : "urgency-medium"
                      }
                    >
                      ⏰ Expires in{" "}
                      {donation.hoursLeft.toFixed(
                        1
                      )}{" "}
                      hours
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
                    navigate(
                      `/shelter/request/${donation.id}`
                    )
                  }
                >
                  🤝 Request Donation
                </button>

              </div>

            )
          )}

        </div>

      )}


      {/* BOTTOM ACTIONS */}

      <div className="center-actions">

        <button
          className="btn-secondary"
          onClick={() =>
            navigate(
              "/shelter/profile"
            )
          }
        >
          ⚙️ Manage Requirements
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
          className="btn-primary"
          onClick={refreshMatches}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "🔄 Refresh Matches"}
        </button>

      </div>

    </div>
  );
}

export default ShelterDashboard;