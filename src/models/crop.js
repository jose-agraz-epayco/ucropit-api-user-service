module.exports = (sequelize, DataTypes) => {
  const Crop = sequelize.define('crops', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    budget: {
      type: DataTypes.STRING,
      allowNull: false
    },
    crop_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    surface: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    quintals: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    reference_price: DataTypes.DOUBLE,
    status: {
      type: DataTypes.ENUM,
      defaultValue: 'checking',
      values: ['checking', 'planing', 'accepted']
    }
  },
    {
      freezeTableName: true,
      tableName: 'crops',
      timestamps: true
    }
  )

  Crop.associate = function (models) {
    Crop.belongsTo(models.crop_types, { foreignKey: 'crop_type_id' })

    
    Crop.belongsToMany(models.fields, {
      foreignKey: 'crop_id',
      otherKey: 'field_id',
      through: 'crop_field'
    })
  }

  return Crop
}