const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CarDocument = sequelize.define(
    "CarDocument",
    {
      rc_image_front: DataTypes.STRING,
      rc_image_back: DataTypes.STRING,
      insurance_image: DataTypes.STRING,
      pollution_image: DataTypes.STRING,
    },
    { timestamps: false }
  );

  CarDocument.associate = (models) => {
    CarDocument.belongsTo(models.Car, { foreignKey: "car_id" });
  };

  return CarDocument;
};
