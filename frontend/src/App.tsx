import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmailLogs from './pages/EmailLogs';
import CottonData from './pages/CottonData';
import PaymentDashboard from './pages/PaymentDashboard';
import ContractManagement from './pages/ContractManagement';
import SamplingEntry from './pages/SamplingEntry';
import CustomerOrders from './pages/CustomerOrders';
import SalesManagement from './pages/SalesManagement';
import AdminContractDashboard from './components/AdminContractDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/emails" element={<EmailLogs />} />
            <Route path="/cotton-data" element={<CottonData />} />
            <Route path="/payments" element={<PaymentDashboard />} />
            <Route path="/contracts" element={<ContractManagement />} />
            <Route path="/sampling" element={<SamplingEntry />} />
            <Route path="/orders" element={<CustomerOrders />} />
            <Route path="/sales" element={<SalesManagement />} />
            <Route path="/admin/contracts" element={<AdminContractDashboard />} />
            <Route path="/logs" element={<div className="p-8 text-center text-gray-500">Processing Logs - Coming Soon</div>} />
            <Route path="/review" element={<div className="p-8 text-center text-gray-500">Manual Review - Coming Soon</div>} />
            <Route path="/settings" element={<div className="p-8 text-center text-gray-500">Settings - Coming Soon</div>} />
          </Routes>
        </Layout>
      </Router>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
}

export default App;