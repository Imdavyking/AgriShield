import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { getUserPolicies } from "../../services/blockchain.services";
import Policy from "./policy";

ChartJS.register(ArcElement, Tooltip, Legend);

type PlanStatus = "Active" | "Expired" | "Withdrawn";
export interface PaidPlan {
  id: string;
  planId: string;
  latitude: number;
  longitude: number;
  startDate: number;
  endDate: number;
  amountInUsd: number;
  status: PlanStatus;
}
const DashboardPage = () => {
  const [paidPlans, setPaidPlan] = useState<PaidPlan[]>([]);

  const total = paidPlans.length;
  const active = paidPlans.filter((p) => p.status === "Active").length;
  const expired = paidPlans.filter((p) => p.status === "Expired").length;
  const withdrawn = paidPlans.filter((p) => p.status === "Withdrawn").length;
  const totalUsd = paidPlans.reduce((sum, p) => sum + p.amountInUsd, 0);

  useEffect(() => {
    const getUserPoliciesData = async () => {
      try {
        const policies = await getUserPolicies();
        console.log("User Policies:", policies);
        setPaidPlan(policies);
      } catch (error) {
        console.error("Error fetching user policies:", error);
      }
    };
    getUserPoliciesData();
  }, []);

  const data = {
    labels: ["Active", "Expired", "Withdrawn"],
    datasets: [
      {
        data: [active, expired, withdrawn],
        backgroundColor: ["#10B981", "#EF4444", "#6366F1"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-green-50 to-green-100 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-green-800 text-center">
          🌾 Your AgriShield Dashboard
        </h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white shadow-xl rounded-lg p-4 border-l-4 border-green-500 hover:scale-105 transition">
            <p className="text-sm text-gray-500">Total Policies</p>
            <p className="text-2xl font-bold text-green-700">{total}</p>
          </div>
          <div className="bg-white shadow-xl rounded-lg p-4 border-l-4 border-emerald-500 hover:scale-105 transition">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-emerald-700">{active}</p>
          </div>
          <div className="bg-white shadow-xl rounded-lg p-4 border-l-4 border-blue-500 hover:scale-105 transition">
            <p className="text-sm text-gray-500">Withdrawn</p>
            <p className="text-2xl font-bold text-blue-600">{withdrawn}</p>
          </div>
          <div className="bg-white shadow-xl rounded-lg p-4 border-l-4 border-red-500 hover:scale-105 transition">
            <p className="text-sm text-gray-500">Expired</p>
            <p className="text-2xl font-bold text-red-600">{expired}</p>
          </div>
          <div className="bg-white shadow-xl rounded-lg p-4 border-l-4 border-indigo-500 hover:scale-105 transition">
            <p className="text-sm text-gray-500">Insured Amount</p>
            <p className="text-2xl font-bold text-indigo-700">${totalUsd}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto border border-green-200">
          <h2 className="text-xl font-semibold text-center text-green-700 mb-4">
            Policy Status Distribution
          </h2>
          <Doughnut data={data} />
        </div>

        {/* Policy Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paidPlans.map((plan, i) => (
            <Policy plan={plan} key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
