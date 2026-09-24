import { useEffect, useState } from "react";
import {
  collection,
  getDocs
} from "firebase/firestore";

import db from "../firebase/firestore";

function ImpactDashboard() {
  const [stats, setStats] = useState({
    totalDonations: 0,
    completedDeliveries: 0,
    activeDonations: 0,
    totalQuantity: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadImpact();
  }, []);

  const loadImpact = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "donations")
      );

      let totalDonations = 0;
      let completedDeliveries = 0;
      let activeDonations = 0;
      let totalQuantity = 0;

      snapshot.forEach((item) => {
        const donation = item.data();

        totalDonations++;

        if (donation.status === "COMPLETED") {
          completedDeliveries++;
          totalQuantity += Number(
            donation.quantity || 0
          );
        }

        if (
          donation.status !== "COMPLETED" &&
          donation.status !== "REJECTED"
        ) {
          activeDonations++;
        }
      });

      setStats({
        totalDonations,
        completedDeliveries,
        activeDonations,
        totalQuantity
      });

    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading impact data...</h2>;
  }

  return (
    <div>
      <h1>Impact Dashboard</h1>

      <p>
        See the impact created through Surplus to Shelter.
      </p>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <hr />

      <div>
        <h2>Total Donations</h2>
        <h1>{stats.totalDonations}</h1>
      </div>

      <hr />

      <div>
        <h2>Completed Deliveries</h2>
        <h1>{stats.completedDeliveries}</h1>
      </div>

      <hr />

      <div>
        <h2>Active Donations</h2>
        <h1>{stats.activeDonations}</h1>
      </div>

      <hr />

      <div>
        <h2>Total Quantity Distributed</h2>
        <h1>{stats.totalQuantity}</h1>
      </div>

      <br />

      <button onClick={loadImpact}>
        Refresh
      </button>
    </div>
  );
}

export default ImpactDashboard;