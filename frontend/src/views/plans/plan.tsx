import { ellipsify } from "../../utils/ellipsify";
const formatDate = (unix: string | number) => {
  return new Date(+unix * 1000).toLocaleDateString();
};
const Plan = ({ plan }: { plan: any }) => {
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
      <span className="font-semibold">Start:</span> {formatDate(plan.startDate)}
    </p>
    <p className="text-gray-700">
      <span className="font-semibold">End:</span> {formatDate(plan.endDate)}
    </p>
    <p className="text-gray-700 mb-4">
      <span className="font-semibold">Amount:</span> ${plan.amountInUsd}
    </p>
    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
      Pay
    </button>
  </div>;
};

export default Plan;
