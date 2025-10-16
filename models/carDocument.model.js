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
        allowNull: true,
      },
      rc_number: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      city_of_registration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rc_valid_till: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
      }, // ------- NEW FIELDS BELOW -------
      hand_type: {
        type: DataTypes.ENUM("First", "Second"),
        allowNull: false,
        defaultValue: "First",
      },
      registration_type: {
        type: DataTypes.ENUM("Private", "Commercial"),
        allowNull: false,
        defaultValue: "Private",
      }, // ------- END NEW FIELDS -------
      insurance_company: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      insurance_idv_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      insurance_valid_till: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
      },
    },
    { timestamps: true }
  );

  CarDocument.associate = (models) => {
    CarDocument.belongsTo(models.Car, { foreignKey: "car_id", as: "car" });
  };

  return CarDocument;
};
