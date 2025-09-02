const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CarDocument = sequelize.define(
    "CarDocument",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      car_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // one document set per car
      },
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
