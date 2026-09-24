import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import { auth } from "../firebase/auth";
import db from "../firebase/firestore";

function ShelterProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organization: "",
    requiredItemType: "FOOD",
    requiredQuantity: "",
    latitude: "",
    longitude: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      const userRef = doc(
        db,
        "users",
        auth.currentUser.uid
      );

      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        throw new Error("Shelter profile not found.");
      }

      const data = snapshot.data();

      setForm({
        organization: data.organization || "",
        requiredItemType:
          data.requiredItemType || "FOOD",
        requiredQuantity:
          data.requiredQuantity || "",
        latitude: data.latitude || "",
        longitude: data.longitude || ""
      });

    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const getLocation = () => {
    setError("");
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
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));

        setLocationLoading(false);
      },
      (error) => {
        console.error(error);

        setError(
          "Unable to get location. Please allow location permission."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSaving(true);

    try {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      if (!form.latitude || !form.longitude) {
        throw new Error(
          "Please capture your shelter location."
        );
      }

      if (!form.requiredQuantity) {
        throw new Error(
          "Please enter required quantity."
        );
      }

      const userRef = doc(
        db,
        "users",
        auth.currentUser.uid
      );

      await updateDoc(userRef, {
        organization: form.organization,
        requiredItemType: form.requiredItemType,
        requiredQuantity: Number(
          form.requiredQuantity
        ),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });

      alert("Shelter requirements saved!");

      navigate("/shelter");

    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <h2>Loading shelter profile...</h2>;
  }

  return (
    <div>
      <h1>Shelter Profile</h1>

      <p>
        Set your requirements so we can find
        suitable donations for your shelter.
      </p>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>

        <label>
          Organization Name
        </label>

        <br />

        <input
          type="text"
          name="organization"
          value={form.organization}
          onChange={handleChange}
          placeholder="Hope Shelter"
          required
        />

        <br />
        <br />

        <label>
          Required Item
        </label>

        <br />

        <select
          name="requiredItemType"
          value={form.requiredItemType}
          onChange={handleChange}
        >
          <option value="FOOD">
            Food
          </option>

          <option value="CLOTHES">
            Clothes
          </option>

          <option value="MEDICINE">
            Medicine
          </option>

          <option value="FURNITURE">
            Furniture
          </option>

          <option value="OTHER">
            Other
          </option>
        </select>

        <br />
        <br />

        <label>
          Required Quantity
        </label>

        <br />

        <input
          type="number"
          name="requiredQuantity"
          min="1"
          value={form.requiredQuantity}
          onChange={handleChange}
          placeholder="50"
          required
        />

        <br />
        <br />

        <button
          type="button"
          onClick={getLocation}
          disabled={locationLoading}
        >
          {locationLoading
            ? "Getting Location..."
            : "📍 Use My Current Location"}
        </button>

        {form.latitude &&
          form.longitude && (
            <p style={{ color: "green" }}>
              ✓ Location captured
            </p>
          )}

        <br />
        <br />

        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Requirements"}
        </button>

      </form>

      <br />

      <button
        onClick={() => navigate("/shelter")}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default ShelterProfile;