import { useEffect, useState } from "react";
import {
  createInsurance,
  getAllInsurance,
} from "../../services/blockchain.services";
import { FaSpinner } from "react-icons/fa";
import Plan from "./plan";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPlan, setCreatingPlan] = useState(false);
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const insurancePlans = await getAllInsurance();
        setPlans(insurancePlans);
      } catch (error) {
        console.error("Error fetching insurance plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const createIplan = async () => {
    try {
      setCreatingPlan(true);
      await createInsurance();
    } catch (error) {
    } finally {
      setCreatingPlan(false);
    }
  };
  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-8 text-center">
          Available Insurance Plans
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <div className="col-span-full text-center">
              <FaSpinner className="animate-spin w-8 h-8 text-green-600 mx-auto" />
              <p className="text-gray-600 mt-4">Loading plans...</p>
            </div>
          )}

          {!isLoading && plans.length == 0 && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition cursor-pointer"
              onClick={createIplan}
              disabled={isCreatingPlan}
            >
              {isCreatingPlan ? (
                <FaSpinner className="animate-spin" />
              ) : (
                "Create Plan"
              )}
            </button>
          )}

          {plans.map((plan: any, index) => (
            <Plan plan={plan} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
