module.exports = (sequelize, DataTypes) => {
  const ChecklistItem = sequelize.define("ChecklistItem", {
    title: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM("pending", "done", "skipped"),
      defaultValue: "pending",
    },
    remarks: DataTypes.TEXT,
    completed_at: DataTypes.DATE,
  });

  ChecklistItem.associate = (models) => {
    ChecklistItem.belongsTo(models.ServiceBooking, {
      foreignKey: "booking_id",
    });
  };

  return ChecklistItem;
};
