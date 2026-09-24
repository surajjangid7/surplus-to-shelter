import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import db from "../firebase/firestore";
import { auth } from "../firebase/auth";

function AddDonation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    itemType: "Food",
    title: "",
    description: "",
    quantity: "",
    unit: "Meals",
    expiryTime: "",
    address: ""
  });

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // =====================================
  // GET CURRENT LOCATION
  // =====================================

  const getCurrentLocation = () => {
    setError("");
    setSuccess("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );

      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude
        );

        setLongitude(
          position.coords.longitude
        );

        setLocationLoading(false);

        setSuccess(
          "📍 Current location captured successfully."
        );
      },

      (error) => {
        console.error(
          "Location error:",
          error
        );

        setLocationLoading(false);

        setError(
          "Unable to get your location. Please allow location access in your browser."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // =====================================
  // SUBMIT DONATION
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const user = auth.currentUser;

    if (!user) {
      navigate("/login");
      return;
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      setError(
        "Please capture your current location before posting the donation."
      );
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Please enter a donation title."
      );
      return;
    }

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      setError(
        "Please enter a valid quantity."
      );
      return;
    }

    if (!form.address.trim()) {
      setError(
        "Please enter the pickup address."
      );
      return;
    }

    setLoading(true);

    try {
      await addDoc(
        collection(db, "donations"),
        {
          donorId: user.uid,

          itemType: form.itemType,

          title: form.title.trim(),

          description:
            form.description.trim(),

          quantity:
            Number(form.quantity),

          unit: form.unit,

          expiryTime:
            form.expiryTime || "",

          address:
            form.address.trim(),

          latitude,
          longitude,

          status: "AVAILABLE",

          createdAt:
            serverTimestamp()
        }
      );

      alert(
        "🎉 Donation posted successfully!"
      );

      navigate("/donor");

    } catch (error) {
      console.error(
        "Donation creation error:",
        error
      );

      setError(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">

      <div className="form-card">

        {/* =================================
            HEADER
        ================================= */}

        <div className="form-header">

          <p className="eyebrow">
            SURPLUS TO SHELTER
          </p>

          <h1>
            🎁 Add Donation
          </h1>

          <p>
            Share your surplus resources with
            shelters that need them.
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
            SUCCESS
        ================================= */}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}


        {/* =================================
            FORM
        ================================= */}

        <form
          className="donation-form"
          onSubmit={handleSubmit}
        >

          {/* ITEM TYPE */}

          <div className="form-group">

            <label htmlFor="itemType">
              Item Type
            </label>

            <select
              id="itemType"
              name="itemType"
              value={form.itemType}
              onChange={handleChange}
              required
            >

              <option value="Food">
                🍱 Food
              </option>

              <option value="Clothes">
                👕 Clothes
              </option>

              <option value="Medicine">
                💊 Medicine
              </option>

              <option value="Furniture">
                🪑 Furniture
              </option>

              <option value="Books">
                📚 Books
              </option>

              <option value="Other">
                📦 Other
              </option>

            </select>

          </div>


          {/* DONATION TITLE */}

          <div className="form-group">

            <label htmlFor="title">
              Donation Title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. 50 Fresh Meal Boxes"
              value={form.title}
              onChange={handleChange}
              required
            />

          </div>


          {/* DESCRIPTION */}

          <div className="form-group">

            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Describe the items you are donating..."
              value={form.description}
              onChange={handleChange}
              rows="4"
            />

          </div>


          {/* QUANTITY + UNIT */}

          <div className="form-row">

            <div className="form-group">

              <label htmlFor="quantity">
                Quantity
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={form.quantity}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="unit">
                Unit
              </label>

              <select
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
              >

                <option value="Meals">
                  Meals
                </option>

                <option value="Kg">
                  Kg
                </option>

                <option value="Items">
                  Items
                </option>

                <option value="Boxes">
                  Boxes
                </option>

                <option value="Pieces">
                  Pieces
                </option>

                <option value="Bottles">
                  Bottles
                </option>

              </select>

            </div>

          </div>


          {/* EXPIRY */}

          <div className="form-group">

            <label htmlFor="expiryTime">
              Expiry / Best Before
            </label>

            <input
              id="expiryTime"
              name="expiryTime"
              type="datetime-local"
              value={form.expiryTime}
              onChange={handleChange}
            />

            <small>
              Especially important for food
              and other time-sensitive donations.
            </small>

          </div>


          {/* ADDRESS */}

          <div className="form-group">

            <label htmlFor="address">
              Pickup Address
            </label>

            <textarea
              id="address"
              name="address"
              placeholder="Enter the address where the donation can be picked up"
              value={form.address}
              onChange={handleChange}
              rows="3"
              required
            />

          </div>


          {/* LOCATION */}

          <div className="location-section">

            <h3>
              📍 Pickup Location
            </h3>

            <p>
              Your location helps us match
              your donation with nearby shelters.
            </p>

            <button
              type="button"
              className="btn-secondary"
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading
                ? "📍 Getting Location..."
                : "📍 Use My Current Location"}
            </button>


            {latitude !== null &&
              longitude !== null && (

                <div className="location-success">

                  ✓ Location captured successfully

                  <br />

                  <small>
                    Latitude:{" "}
                    {latitude.toFixed(6)}
                    {" | "}
                    Longitude:{" "}
                    {longitude.toFixed(6)}
                  </small>

                </div>

              )}

          </div>


          {/* ACTIONS */}

          <div className="form-actions">

            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                navigate("/donor")
              }
              disabled={loading}
            >
              ← Cancel
            </button>


            <button
              type="submit"
              className="btn-primary"
              disabled={
                loading ||
                locationLoading
              }
            >
              {loading
                ? "🔄 Posting..."
                : "🎁 Post Donation"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddDonation;