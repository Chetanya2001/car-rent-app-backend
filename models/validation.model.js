const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Validation = sequelize.define(
    "Validation",
    {
      entity_type: { type: DataTypes.ENUM("car", "guest") },
      entity_id: DataTypes.INTEGER,
      status: { type: DataTypes.ENUM("approved", "rejected", "pending") },
      remarks: DataTypes.TEXT,
      validated_at: DataTypes.DATE,
    },
    { timestamps: false }
  );

  Validation.associate = (models) => {
    Validation.belongsTo(models.User, {
      as: "validator",
      foreignKey: "validated_by",
    });
  };

  return Validation;
};
