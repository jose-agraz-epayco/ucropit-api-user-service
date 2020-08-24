require('dotenv').config()
import models, { connectDb } from '../models'
import chalk from 'chalk'
import { cropTypes, unitTypes } from './data'

const CropType = models.CropType
const UnitType = models.UnitType

/**
 * Seeders CropType
 */
const seedersCropType = async () => {
  console.log(`${chalk.green('=====Registering CropTypes====')}`)

  await CropType.deleteMany({})

  for (const cropType of cropTypes) {
    await CropType.create(cropType)
  }
  console.log(`${chalk.green('=====Registered CropTypes====')}`)
  return true
}

/**
 * Seeder UnitType
 */
const seedersUnitType = async () => {
  console.log(`${chalk.green('=====Registering UnitType====')}`)

  await UnitType.deleteMany({})

  for (const unitType of unitTypes) {
    await UnitType.create(unitType)
  }

  console.log(`${chalk.green('=====Registered UnitType====')}`)
  return true
}

(async () => {
  const connected = await connectDb()

  if (connected) {
    await seedersUnitType()
    await seedersCropType()
  }
  process.exit()
})()
