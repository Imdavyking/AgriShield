import express from "express";
import { getJsonProof } from "../controllers/fdc.controllers";

const fdcRoutes = express.Router();
fdcRoutes.get("/json-proof/:lat/:long", getJsonProof);

export default fdcRoutes;
