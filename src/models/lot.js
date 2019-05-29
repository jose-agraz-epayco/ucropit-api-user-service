module.exports = (sequelize, DataTypes) => {
  const Lot = sequelize.define('lots', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    surface: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    kmz_path: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
  },
    {
      freezeTableName: true,
      tableName: 'lots',
      timestamps: true
    }
  )

  return Lot
}