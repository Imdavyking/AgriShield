//
import { BACKEND_URL } from "../utils/constants";

export const getWeatherData = async ({
  lat,
  long,
}: {
  lat: string;
  long: string;
}) => {
  const storageKey = `latitude=${lat}&longitude=${long}`;
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m`
  );

  if (!response.ok) {
    if (!!localStorage.getItem(storageKey)) {
      return localStorage.getItem(storageKey);
    }
    throw new Error("Failed to fetch llm response");
  }

  const data = await response.json();
  localStorage.setItem(storageKey, data);
  return data;
};
