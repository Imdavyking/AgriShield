import { useEffect, useState } from "react";
import { getAllInsurance } from "../../services/blockchain.services";

const formatDate = (unix: string | number) => {
  return new Date(+unix * 1000).toLocaleDateString();
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const insurancePlans = await getAllInsurance();
        setPlans(insurancePlans);
      } catch (error) {
        console.error("Error fetching insurance plans:", error);
      }
    };

    fetchPlans();
  }, []);
  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-8 text-center">
          Available Insurance Plans
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white shadow-md rounded-lg p-6 border border-green-100"
            >
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                Plan #{plan.id}
              </h2>
              <p className="text-gray-700">
                <span className="font-semibold">Location:</span>{" "}
                {plan.latitude.toFixed(4)}, {plan.longitude.toFixed(4)}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Start:</span>{" "}
                {formatDate(plan.startDate)}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">End:</span>{" "}
                {formatDate(plan.endDate)}
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Amount:</span> $
                {plan.amountInUsd}
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                Pay
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
