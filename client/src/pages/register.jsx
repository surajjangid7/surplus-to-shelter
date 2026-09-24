import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../services/userService";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "DONOR",
    organization: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await createUser(form);

      alert(
        "Account created successfully! Your account is now waiting for Admin verification."
      );

      navigate("/login");

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div
        className="auth-card"
        style={{ maxWidth: "520px" }}
      >

        {/* BRAND */}
        <div className="auth-brand">

          <div className="auth-logo">
            🏠
          </div>

          <p className="eyebrow">
            SURPLUS TO SHELTER
          </p>

          <h1>
            Create Your Account
          </h1>

          <p>
            Join the community and help
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


        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          {/* NAME */}
          <div className="form-group">

            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />

          </div>


          {/* EMAIL */}
          <div className="form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

          </div>


          {/* PASSWORD */}
          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength="6"
              required
            />

            <small>
              Password must contain at least
              6 characters.
            </small>

          </div>


          {/* PHONE */}
          <div className="form-group">

            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
            />

          </div>


          {/* ROLE */}
          <div className="form-group">

            <label htmlFor="role">
              I want to join as
            </label>

            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >

              <option value="DONOR">
                🎁 Donor
              </option>

              <option value="SHELTER">
                🏠 Shelter / NGO
              </option>

              <option value="VOLUNTEER">
                🚚 Volunteer
              </option>

            </select>

          </div>


          {/* ORGANIZATION */}
          <div className="form-group">

            <label htmlFor="organization">
              Organization Name
              <span
                style={{
                  fontWeight: "normal",
                  color: "#777"
                }}
              >
                {" "}
                (Optional)
              </span>
            </label>

            <input
              id="organization"
              name="organization"
              type="text"
              placeholder="Enter organization name"
              value={form.organization}
              onChange={handleChange}
            />

          </div>


          {/* SUBMIT */}
          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading}
          >
            {loading
              ? "🔄 Creating Account..."
              : "✓ Create Account"}
          </button>

        </form>


        {/* VERIFICATION NOTICE */}
        <div
          className="alert alert-info"
          style={{ marginTop: "20px" }}
        >
          🛡️ After registration, your account
          will need Admin verification before
          you can access the dashboard.
        </div>


        {/* LOGIN */}
        <div className="auth-footer">

          <p>
            Already have an account?
          </p>

          <button
            className="btn-secondary full-width"
            onClick={() =>
              navigate("/login")
            }
            disabled={loading}
          >
            🔐 Login
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

export default Register;