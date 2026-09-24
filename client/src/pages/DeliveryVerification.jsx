import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import db from "../firebase/firestore";
import { auth } from "../firebase/auth";
import { createNotification } from "../services/notificationService";

function DeliveryVerification() {
  const { donationId } = useParams();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyDelivery = async (e) => {
    e.preventDefault();

    setError("");

    if (otp.length !== 4) {
      setError("Enter a valid 4-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      if (!auth.currentUser) {
        throw new Error(
          "Please login first."
        );
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

      const donation = snapshot.data();

      // Make sure this delivery belongs
      // to the current volunteer.
      if (
        donation.volunteerId !==
        auth.currentUser.uid
      ) {
        throw new Error(
          "This delivery is not assigned to you."
        );
      }

      // Delivery must be out for delivery.
      if (
        donation.status !==
        "OUT_FOR_DELIVERY"
      ) {
        throw new Error(
          "This delivery is not ready for verification."
        );
      }

      // Verify OTP.
      if (
        donation.deliveryOtp !== otp
      ) {
        throw new Error(
          "Incorrect OTP. Please try again."
        );
      }

      // Complete delivery.
      await updateDoc(
        donationRef,
        {
          status: "COMPLETED",
          completedAt: serverTimestamp()
        }
      );

      // Notify shelter.
      if (donation.shelterId) {
        await createNotification({
          userId: donation.shelterId,
          title:
            "🎉 Delivery Completed",
          message:
            `Your donation "${donation.title}" has been successfully delivered.`,
          type:
            "DELIVERY_COMPLETED"
        });
      }

      alert(
        "🎉 Delivery completed successfully!"
      );

      navigate("/volunteer");

    } catch (error) {
      console.error(
        "Delivery verification error:",
        error
      );

      setError(error.message);

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header">

        <div>
          <p className="eyebrow">
            SURPLUS TO SHELTER
          </p>

          <h1>
            🔐 Verify Delivery
          </h1>

          <p>
            Confirm the delivery using the
            4-digit OTP provided by the shelter.
          </p>
        </div>

      </div>


      {/* VERIFICATION CARD */}
      <div
        className="card"
        style={{
          maxWidth: "520px",
          margin: "30px auto"
        }}
      >

        <div
          style={{
            textAlign: "center",
            marginBottom: "25px"
          }}
        >

          <div
            style={{
              fontSize: "60px",
              marginBottom: "10px"
            }}
          >
            🔐
          </div>

          <h2>
            Delivery Verification
          </h2>

          <p>
            Ask the shelter recipient for
            their 4-digit delivery OTP.
          </p>

        </div>


        {/* ERROR */}
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}


        {/* OTP FORM */}
        <form
          onSubmit={verifyDelivery}
        >

          <label
            htmlFor="deliveryOtp"
            className="info-label"
          >
            Delivery OTP
          </label>

          <input
            id="deliveryOtp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength="4"
            placeholder="Enter 4-digit OTP"
            value={otp}
            onChange={(e) =>
              setOtp(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4)
              )
            }
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: "28px",
              letterSpacing: "10px",
              marginTop: "8px"
            }}
            required
          />


          <button
            type="submit"
            className="btn-primary full-width"
            disabled={
              loading ||
              otp.length !== 4
            }
            style={{
              marginTop: "20px"
            }}
          >
            {loading
              ? "Verifying..."
              : "✓ Verify & Complete Delivery"}
          </button>

        </form>


        {/* SECURITY MESSAGE */}
        <div
          className="alert alert-info"
          style={{
            marginTop: "20px"
          }}
        >
          🔒 The delivery will only be marked
          as completed when the correct OTP
          is entered.
        </div>


        {/* BACK */}
        <button
          className="btn-secondary full-width"
          onClick={() =>
            navigate("/volunteer")
          }
          disabled={loading}
          style={{
            marginTop: "10px"
          }}
        >
          ← Back to Volunteer Dashboard
        </button>

      </div>

    </div>
  );
}

export default DeliveryVerification;