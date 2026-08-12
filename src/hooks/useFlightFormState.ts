import { useState } from "react";
import type { TravelClass } from "@/types/flights";

export type TripType = "one-way" | "round-trip" | "multi-city";

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export function useFlightFormState() {
  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelClass, setTravelClass] = useState<TravelClass>("economy");
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  function swapLocations() {
    setFrom(to);
    setTo(from);
  }

  function adjustPassenger(type: keyof PassengerCounts, delta: number) {
    setPassengers((prev) => {
      const next = prev[type] + delta;
      const min = type === "adults" ? 1 : 0;
      const max = type === "infants" ? prev.adults : 9;
      return { ...prev, [type]: Math.min(max, Math.max(min, next)) };
    });
  }

  function clearForm() {
    setFrom("");
    setTo("");
    setDeparture("");
    setReturnDate("");
    setTravelClass("economy");
    setPassengers({ adults: 1, children: 0, infants: 0 });
  }

  return {
    tripType,
    setTripType,
    from,
    setFrom,
    to,
    setTo,
    departure,
    setDeparture,
    returnDate,
    setReturnDate,
    travelClass,
    setTravelClass,
    passengers,
    totalPassengers,
    swapLocations,
    adjustPassenger,
    clearForm,
  };
}
