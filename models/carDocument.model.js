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
      rc_image_front: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rc_image_back: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      insurance_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pollution_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fastag_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      trip_start_balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      trip_end_balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      owner_name: {
        type: DataTypes.STRING,
        allowNull: false, // Required, as owner name is mandatory on RC
      },
      rc_number: {
        type: DataTypes.STRING,
        allowNull: false, // Required, as RC number is unique and mandatory
        unique: true, // Ensure RC number is unique across records
      },
      city_of_registration: {
        type: DataTypes.STRING,
        allowNull: false, // Required, as city of registration is mandatory
      },
      rc_valid_till: {
        type: DataTypes.DATEONLY,
        allowNull: false, // Required, as RC validity date is mandatory
      },
      insurance_company: {
        type: DataTypes.STRING,
        allowNull: false, // Required, as insurance company is mandatory
      },
      insurance_idv_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false, // Required, as IDV is a critical insurance detail
        validate: {
          min: 0, // Ensure IDV is non-negative
        },
      },
      insurance_valid_till: {
        type: DataTypes.DATEONLY,
        allowNull: false, // Required, as insurance validity date is mandatory
      },
    },
    { timestamps: false }
  );

  CarDocument.associate = (models) => {
    CarDocument.belongsTo(models.Car, { foreignKey: "car_id" });
  };

  return CarDocument;
};
