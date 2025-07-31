import { useState } from "react";
import { LOCATION_DECIMAL_PLACES } from "../../utils/constants";
import { ellipsify } from "../../utils/ellipsify";
import { PaidPlan } from "./main";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import {
  refundPolicy,
  rethrowFailedResponse,
} from "../../services/blockchain.services";

const formatDate = (unix: string | number) =>
  new Date(+unix * 1000).toLocaleDateString();

const Policy = ({ plan }: { plan: PaidPlan }) => {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setIsFetching(true);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) {
        throw Error("Failed to fetch weather");
      }
      const data = await response.json();
      return data.current;
    } catch (error) {
      toast.error("Failed to fetch weather");
    } finally {
      setIsFetching(false);
    }
  };
  const handleCardClick = async (plan: PaidPlan) => {
    setSelectedPlan(plan);

    try {
      const data = await fetchWeather(plan.latitude, plan.longitude);
      setShowModal(true);
      setWeatherData(data);
    } catch (err) {
      console.error("Weather fetch failed", err);
    }
  };

  const handleRefund = async () => {
    if (!selectedPlan) return;
    try {
      setIsRefunding(true);
      const response = await refundPolicy({
        policyId: selectedPlan.id,
        lat: selectedPlan.latitude.toString(),
        long: selectedPlan.longitude.toString(),
      });
      rethrowFailedResponse(response);
      toast.success("Refund processed successfully!");
      setShowModal(false);
    } catch (error) {
      console.error("Refund error:", error);
      toast.error(
        error instanceof Error ? error.message : "Refund failed unexpectedly"
      );
    } finally {
      setIsRefunding(false);
    }
  };
  return (
    <div
      key={plan.id}
      className="bg-white rounded-xl p-5 shadow-lg border-t-4 hover:shadow-xl hover:border-green-500 transition"
    >
      <h3 className="text-lg font-bold text-green-800 mb-2">
        Policy #{ellipsify(plan.id.toString(), 10)}
      </h3>
      <p className="text-gray-600 text-sm">
        <strong>Location:</strong>{" "}
        {plan.latitude.toFixed(LOCATION_DECIMAL_PLACES)},{" "}
        {plan.longitude.toFixed(LOCATION_DECIMAL_PLACES)}
      </p>
      <p className="text-gray-600 text-sm">
        <strong>Duration:</strong> {formatDate(plan.startDate)} -{" "}
        {formatDate(plan.endDate)}
      </p>
      <p className="text-gray-600 text-sm">
        <strong>Amount:</strong> ${plan.amountInUsd}
      </p>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold w-max ${
            plan.status === "Active"
              ? "bg-green-100 text-green-700"
              : plan.status === "Expired"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {plan.status}
        </span>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
          onClick={() => handleCardClick(plan)}
          disabled={isFetching}
        >
          {isFetching ? <FaSpinner className="animate-spin" /> : "Weather Data"}
        </button>
      </div>

      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-3 text-gray-600 hover:text-red-600"
            >
              X
            </button>
            <h3 className="text-xl font-bold text-green-700 mb-2">
              Weather @ {selectedPlan.latitude.toFixed(2)},{" "}
              {selectedPlan.longitude.toFixed(2)}
            </h3>
            {weatherData ? (
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Temperature:</strong> {weatherData.temperature_2m}°C
                </p>
                <p>
                  <strong>Wind Speed:</strong> {weatherData.wind_speed_10m} km/h
                </p>
                <p>
                  <strong>Precipitation:</strong>{" "}
                  {weatherData.precipitation ?? "N/A"} mm
                </p>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition cursor-pointer"
                  onClick={handleRefund}
                  disabled={isRefunding}
                >
                  {isRefunding ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    "Refund if Temp > 20ᴼC"
                  )}
                </button>
              </div>
            ) : (
              <p>Loading weather data...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Policy;
