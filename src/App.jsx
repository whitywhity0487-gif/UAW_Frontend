import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login";
import Home from "./Pages/Home";
import Demand from "./Pages/Demand";
import Recruiter from "./Pages/Recruiter";
import CreateUser from "./Pages/CreateUser";
import R_home from "./Pages/R_home.jsx";
import Holiday from "./Pages/Details/Holiday.jsx"
import Mypersonaldetails from "./Pages/Details/profile/Mypersonaldetails.jsx";
import Policy from "./Pages/Details/policy/Policy.jsx"
import Joined from "./Pages/Joined.jsx";
import AdminProfileManagement from "./Pages/admin/AdminProfileManagement.jsx";
import ModuleAccessGuard from "./components/ModuleAccessGuard.jsx"
import { UserProvider } from "./context/UserContext";
import UawAwardpolicy from "./Pages/Details/policy/UawAwardpolicy.jsx";
import Salaryadvance from "./Pages/Details/policy/Salaryadvance.jsx";
import AdminSalaryAdvance from './Pages/admin/AdminSalaryAdvance';
import Birthdaywishes from './Pages/Details/Birthdaywishes.jsx';
import Travelpolicy from "./Pages/Details/policy/Travelpolicy.jsx";
import InsurancePolicy from "./Pages/Details/policy/Insurancepolicy";
import Assets from "./Pages/Details/Employeeassets.jsx";
import AdminHoliday from "./Pages/admin/AdminHoliday.jsx"
import AdminAssetsManagement from "./Pages/admin/AdminAssetsManagement.jsx";
import Reimbursements from "./Pages/Details/Reimbursements.jsx";
import AdminReimbursement from "./Pages/admin/AdminReimbursement.jsx";
import LeaveManagement from "./Pages/Details/LeaveManagement.jsx";
import AdminLeaveManagement from "./Pages/admin/AdminLeaveManagement.jsx";
import AdminMyTeam from "./Pages/admin/AdminMyTeam.jsx";
import MyTeam from "./Pages/Details/MyTeam.jsx";
import AdminPayroll from "./Pages/admin/AdminPayroll.jsx";
import PayrollDashboard from "./Pages/Details/PayrollDashboard.jsx";
import AdminMyclient from "./Pages/admin/AdminMyclient.jsx";
import Myclient from "./Pages/Details/Myclient.jsx";
import Timesheet from "./Pages/Details/Timesheet.jsx";
import AdminTimesheet from "./Pages/admin/AdminTimesheet.jsx";

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const isClientInterviewer = user.role === "Client Interviewer";

  if (isClientInterviewer && window.location.pathname === "/home") {
    return <Navigate to="/demand" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return React.cloneElement(children, { user });
};

function App() {
  return (
    <UserProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes - Module Access Guard Applied */}
        <Route
          path="/demand"
          element={
            <ProtectedRoute>
              <Demand />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Recruiter page - Only accessible by Admin and Recruiter */}
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Recruiter"]}>
              <Recruiter />
            </ProtectedRoute>
          }
        />

        

        {/* Recruitment page - For all roles */}
        <Route path="/recruitment" element={<R_home />} />

        {/* Admin Only Routes */}
        <Route
          path="/create-user"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <CreateUser />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/profile-management"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminProfileManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/birthday-wishes"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Birthdaywishes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/holiday"
          element={
            <ProtectedRoute>
              <ModuleAccessGuard moduleName="Holiday Calendar">
                <Holiday />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Main Policy Route */}
        <Route
          path="/policy"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="Policies">
                <Policy />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* UAW Award Policy Route */}
        <Route
          path="/uaw-award-policy"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="UAW Award Policy">
                <UawAwardpolicy />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Salary Advance Policy Route */}
        <Route
          path="/salary-advance"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="Salary Advance">
                <Salaryadvance />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Travel Policy Route - NEW */}
        <Route
          path="/travel-policy"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="Travel Policy">
                <Travelpolicy />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Insurance Policy Route */}
        <Route
          path="/insurance-policy"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="Insurance Policy">
                <InsurancePolicy />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/assets"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ModuleAccessGuard moduleName="Admin Assets">
                <AdminAssetsManagement />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/holiday"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ModuleAccessGuard moduleName="Holiday Calendar">
                <AdminHoliday />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Assets Route - NEW */}
        <Route
          path="/assets"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="My Assets">
                <Assets />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* My Personal Details - Always accessible (no module guard) */}
        <Route
          path="/mypersonaldetails"
          element={
            <ProtectedRoute>
              <Mypersonaldetails />
            </ProtectedRoute>
          }
        />

        <Route path="/joined" element={<Joined />} />


    

        {/* Employee Reimbursements Route */}
        <Route
          path="/reimbursements"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="Reimbursements">
                <Reimbursements />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin Reimbursements Route */}
        <Route
          path="/admin/reimbursements"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ModuleAccessGuard moduleName="Reimbursements">
                <AdminReimbursement />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Leave Management Route */}
        <Route
          path="/leave-management"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="Leave Management">
                <LeaveManagement />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin Leave Management Route */}
        <Route
          path="/admin/leave"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ModuleAccessGuard moduleName="Leave Management">
                <AdminLeaveManagement />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin My Team Route */}
        <Route
          path="/admin/my-team"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminMyTeam />
            </ProtectedRoute>
          }
        />

        {/* My Team Route */}
        <Route
          path="/my-team"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="My Team">
                <MyTeam />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Employee Payroll Route */}
        <Route
          path="/payroll"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="Payroll">
                <PayrollDashboard />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin Payroll Route */}
        <Route
          path="/admin/payroll"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ModuleAccessGuard moduleName="Payroll">
                <AdminPayroll />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Employee My Client Route */}
        <Route
          path="/myclient"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR"]}>
              <ModuleAccessGuard moduleName="My Client">
                <Myclient />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin My Client Route */}
        <Route
          path="/admin/myclient"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ModuleAccessGuard moduleName="My Client">
                <AdminMyclient />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Timesheet Route */}
        <Route
          path="/timesheet"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee", "HR", "Manager"]}>
              <ModuleAccessGuard moduleName="Time Sheet">
                <Timesheet />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin Timesheet Route */}
        <Route
          path="/admintimesheet"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ModuleAccessGuard moduleName="Time Sheet">
                <AdminTimesheet />
              </ModuleAccessGuard>
            </ProtectedRoute>
          }
        />

        {/* Default landing after login */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* Catch all - redirect to home if authenticated, otherwise login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  );
}

export default App;