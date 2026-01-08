function mapSelfDriveCapabilities(car) {
  const policy = car.selfdrive_drop_policy;

  return {
    self_pickup: true,
    doorstep_drop: policy === "flexible" || policy === "fixed",
    drop_pricing_type:
      policy === "fixed"
        ? "fixed"
        : policy === "flexible"
        ? "distance_based"
        : null,
    drop_amount: car.selfdrive_drop_amount,
  };
}

module.exports = { mapSelfDriveCapabilities };
