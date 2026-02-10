module.exports = (sequelize, DataTypes) => {
  const ServiceBooking = sequelize.define("ServiceBooking", {
    status: {
      type: DataTypes.ENUM(
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ),
      defaultValue: "pending",
    },
    scheduled_at: DataTypes.DATE,
    completed_at: DataTypes.DATE,
    total_price: DataTypes.DECIMAL(10, 2),
    notes: DataTypes.TEXT,
  });

  ServiceBooking.associate = (models) => {
    ServiceBooking.belongsTo(models.Car, { foreignKey: "car_id" });
    ServiceBooking.belongsTo(models.User, { foreignKey: "user_id" });
    ServiceBooking.belongsTo(models.ServicePlan, { foreignKey: "plan_id" });

    ServiceBooking.hasMany(models.ChecklistItem, {
      foreignKey: "booking_id",
      as: "checklist",
    });
  };

  return ServiceBooking;
};
