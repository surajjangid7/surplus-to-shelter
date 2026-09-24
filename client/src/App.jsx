import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./pages/register";
import Login from "./pages/login";
import DonorDashboard from "./pages/DonorDashboard";
import ShelterDashboard from "./pages/ShelterDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import AddDonation from "./pages/AddDonation";
import RequestDonation from "./pages/RequestDonation";
import DeliveryVerification from "./pages/DeliveryVerification";
import ImpactDashboard from "./pages/ImpactDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ShelterProfile from "./pages/ShelterProfile";


function Home() {
  return (
    <div>
      <h1>Surplus to Shelter</h1>
      <button onClick={() => window.location.href = "/login"}>
        Login
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/shelter/profile"element={<ShelterProfile />}/>
        <Route path="/admin"element={<AdminDashboard />}/>
        <Route path="/impact"element={<ImpactDashboard />}/>
        <Route path="/volunteer/verify/:donationId"element={<DeliveryVerification />}/>
        <Route path="/shelter/request/:donationId"element={<RequestDonation />}/>
        <Route path="/donor/add-donation"element={<AddDonation /> }/>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/donor" element={<DonorDashboard />} />
        <Route path="/shelter" element={<ShelterDashboard />} />
        <Route path="/volunteer" element={<VolunteerDashboard />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;