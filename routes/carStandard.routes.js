const express = require("express");
const router = express.Router();
const {
  upsertCarStandards,
  getCarStandards,
} = require("../controller/carStandard.controller");

router.post("/", upsertCarStandards);

router.get("/:car_id", getCarStandards);

module.exports = router;
