import { Request, Response } from "express";
import dotenv from "dotenv";
import {
  getEVMTransactionAttestation,
  getJsonAttestation,
} from "../services/fdc.services";
dotenv.config();

export const getJsonProof = async (req: Request, res: Response) => {
  try {
    const { lat, long } = req.params;
    const baseUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m`;
    const data = await getJsonAttestation(baseUrl);
    res.json({ data });
    return;
  } catch (error) {
    console.error("Error generating JSON proof:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
