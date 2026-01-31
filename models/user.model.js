const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true },
      phone: DataTypes.STRING,
      password_hash: DataTypes.STRING,
      role: { type: DataTypes.ENUM("admin", "host", "guest") },
      is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      whatsapp_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      whatsapp_code: { type: DataTypes.STRING },
      whatsapp_code_expires: { type: DataTypes.DATE },

      // ✅ New field for Profile Picture
      profile_pic: {
        type: DataTypes.STRING, // store URL or file path
        allowNull: true,
      },
    },
    { timestamps: true },
  );

  User.associate = (models) => {
    User.hasMany(models.Car, { as: "cars", foreignKey: "host_id" });
    User.hasMany(models.Booking, { as: "bookings", foreignKey: "guest_id" });
    User.hasMany(models.Validation, {
      as: "validations",
      foreignKey: "validated_by",
    });
    User.hasMany(models.UserDocuments, {
      as: "documents",
      foreignKey: "user_id",
    });
    User.hasMany(models.Notification, { foreignKey: "user_id" });
  };

  return User;
};
