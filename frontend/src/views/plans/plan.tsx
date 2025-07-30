import { ellipsify } from "../../utils/ellipsify";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  payForInsurance,
  rethrowFailedResponse,
} from "../../services/blockchain.services";
import { FIAT_DECIMAL_PLACES, NATIVE_TOKEN } from "../../utils/constants";
import { useState } from "react";
const formatDate = (unix: string | number) => {
  return new Date(+unix * 1000).toLocaleDateString();
};
const Plan = ({ plan }: { plan: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const payInsurance = async () => {
    try {
      // Implement the payment logic here
      setIsProcessing(true);
      console.log(`Paying for plan ${plan.id}`);
      const response = await payForInsurance({
        policyId: plan.id,
        token: NATIVE_TOKEN, // Assuming
      });
      rethrowFailedResponse(response);
      toast.success("Payment successful!");
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div
      key={plan.id}
      className="bg-white shadow-md rounded-lg p-6 border border-green-100"
    >
      <h2 className="text-xl font-semibold text-green-800 mb-2">
        Plan #{ellipsify(plan.id, 15)}
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
        <span className="font-semibold">End:</span> {formatDate(plan.endDate)}
      </p>
      <p className="text-gray-700 mb-4">
        <span className="font-semibold">Amount:</span> $
        {plan.amountInUsd / FIAT_DECIMAL_PLACES}
      </p>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition cursor-pointer"
        onClick={payInsurance}
      >
        {isProcessing ? (
          <FaSpinner className="animate-spin w-5 h-5" />
        ) : (
          "Pay Now"
        )}
      </button>
    </div>
  );
};

export default Plan;
