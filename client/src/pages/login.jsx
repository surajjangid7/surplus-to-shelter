import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  loginUser,
  logoutUser
} from "../firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

import db from "../firebase/firestore";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await loginUser(
        email,
        password
      );

      const uid = result.user.uid;

      const userDoc = await getDoc(
        doc(db, "users", uid)
      );

      if (!userDoc.exists()) {
        await logoutUser();

        throw new Error(
          "User profile not found."
        );
      }

      const userData = userDoc.data();

      // ADMIN does not need verification
      if (
        userData.role !== "ADMIN" &&
        userData.verified !== true
      ) {
        await logoutUser();

        setError(
          "Your account is waiting for Admin verification."
        );

        return;
      }

      // Redirect based on role
      switch (userData.role) {
        case "DONOR":
          navigate("/donor");
          break;

        case "SHELTER":
          navigate("/shelter");
          break;

        case "VOLUNTEER":
          navigate("/volunteer");
          break;

        case "ADMIN":
          navigate("/admin");
          break;

        default:
          await logoutUser();

          throw new Error(
            `Invalid user role: ${userData.role}`
          );
      }

    } catch (error) {
      console.error(
        "Login error:",
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
    <div className="auth-page">

      <div className="auth-card">

        {/* LOGO / BRAND */}
        <div className="auth-brand">

          <div className="auth-logo">
            🏠
          </div>

          <p className="eyebrow">
            SURPLUS TO SHELTER
          </p>

          <h1>
            Welcome Back
          </h1>

          <p>
            Sign in to continue helping
            surplus resources reach people
            who need them.
          </p>

        </div>


        {/* ERROR */}
        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}


        {/* LOGIN FORM */}
        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          <div className="form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
              required
            />

          </div>


          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading}
          >
            {loading
              ? "🔄 Logging in..."
              : "🔐 Login"}
          </button>

        </form>


        {/* REGISTER */}
        <div className="auth-footer">

          <p>
            Don't have an account?
          </p>

          <button
            className="btn-secondary full-width"
            onClick={() =>
              navigate("/register")
            }
            disabled={loading}
          >
            Create an Account
          </button>

        </div>


        {/* HOME */}
        <button
          className="text-button"
          onClick={() =>
            navigate("/")
          }
          disabled={loading}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Login;