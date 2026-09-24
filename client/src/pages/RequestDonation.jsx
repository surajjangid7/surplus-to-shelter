import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import db from "../firebase/firestore";
import { auth } from "../firebase/auth";
import { createNotification } from "../services/notificationService";

function RequestDonation() {
  const { donationId } = useParams();
  const navigate = useNavigate();

  const [donation, setDonation] = useState(null);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadDonation();
  }, [donationId]);

  const loadDonation = async () => {
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

      const snapshot = await getDoc(
        donationRef
      );

      if (!snapshot.exists()) {
        throw new Error(
          "Donation not found."
        );
      }

      const data = snapshot.data();

      if (data.status !== "AVAILABLE") {
        throw new Error(
          "This donation is no longer available."
        );
      }

      setDonation({
        id: snapshot.id,
        ...data
      });

    } catch (error) {
      console.error(
        "Load donation error:",
        error
      );

      setError(error.message);

    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const user = auth.currentUser;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!donation) {
      setError(
        "Donation information is unavailable."
      );
      return;
    }

    if (!message.trim()) {
      setError(
        "Please explain why your shelter needs this donation."
      );
      return;
    }

    setSubmitting(true);

    try {

      // Create request
      await addDoc(
        collection(db, "requests"),
        {
          donationId: donation.id,

          shelterId: user.uid,

          message: message.trim(),

          status: "PENDING",

          createdAt:
            serverTimestamp()
        }
      );


      // Notify donor
      if (donation.donorId) {

        await createNotification({
          userId: donation.donorId,

          title:
            "🔔 New Donation Request",

          message:
            `A shelter has requested your "${donation.title}" donation.`,

          type: "REQUEST"
        });

      }


      alert(
        "🤝 Donation request sent successfully!"
      );

      navigate("/shelter");

    } catch (error) {

      console.error(
        "Request donation error:",
        error
      );

      setError(
        error.message
      );

    } finally {
      setSubmitting(false);
    }
  };


  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="form-page">

        <div className="request-card">

          <div className="loading-container">

            <div className="loading-spinner"></div>

            <p>
              Loading donation...
            </p>

          </div>

        </div>

      </div>
    );
  }


  // =====================================
  // ERROR / NOT FOUND
  // =====================================

  if (error && !donation) {
    return (
      <div className="form-page">

        <div className="request-card">

          <div className="form-header">

            <div className="request-icon">
              ⚠️
            </div>

            <h1>
              Unable to Request Donation
            </h1>

            <p>
              {error}
            </p>

          </div>

          <button
            className="btn-secondary full-width"
            onClick={() =>
              navigate("/shelter")
            }
          >
            ← Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  return (
    <div className="form-page">

      <div className="request-card">

        {/* =================================
            HEADER
        ================================= */}

        <div className="form-header">

          <div className="request-icon">
            🤝
          </div>

          <p className="eyebrow">
            SURPLUS TO SHELTER
          </p>

          <h1>
            Request Donation
          </h1>

          <p>
            Tell the donor why this donation
            would help your shelter.
          </p>

        </div>


        {/* =================================
            ERROR
        ================================= */}

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}


        {/* =================================
            DONATION DETAILS
        ================================= */}

        <div className="request-donation-card">

          <div className="request-donation-header">

            <div>

              <span className="info-label">
                AVAILABLE DONATION
              </span>

              <h2>
                {donation.title}
              </h2>

            </div>

            <span className="badge badge-success">
              AVAILABLE
            </span>

          </div>


          <div className="request-info-grid">

            <div className="request-info-item">

              <span className="info-label">
                Item Type
              </span>

              <strong>
                {donation.itemType}
              </strong>

            </div>


            <div className="request-info-item">

              <span className="info-label">
                Quantity
              </span>

              <strong>
                {donation.quantity}{" "}
                {donation.unit}
              </strong>

            </div>


            <div className="request-info-item">

              <span className="info-label">
                Pickup Address
              </span>

              <strong>
                📍 {donation.address ||
                  "Not provided"}
              </strong>

            </div>

          </div>


          {donation.description && (

            <div className="request-description">

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
                📍 View Pickup Location
              </a>

            )}

        </div>


        {/* =================================
            REQUEST FORM
        ================================= */}

        <form
          className="request-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label htmlFor="message">
              Why does your shelter need
              this donation?
            </label>

            <textarea
              id="message"
              placeholder="Explain how this donation will help your shelter..."
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              rows="6"
              maxLength="500"
              required
            />

            <small>
              {message.length}/500 characters
            </small>

          </div>


          {/* ACTIONS */}

          <div className="request-actions">

            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                navigate("/shelter")
              }
              disabled={submitting}
            >
              ← Back to Dashboard
            </button>


            <button
              type="submit"
              className="btn-primary"
              disabled={
                submitting ||
                !message.trim()
              }
            >
              {submitting
                ? "🔄 Sending..."
                : "🤝 Send Request"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default RequestDonation;