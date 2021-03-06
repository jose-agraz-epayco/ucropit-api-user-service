require('dotenv').config()

import chalk from 'chalk'
import { Command, OptionValues } from 'commander'

import models, { connectDb } from '../models'
import { CountryRepository } from '../repositories'

const program = new Command()

program
  .description('Use this command to add the Country in the company')
  .option('-a, --add', 'Add the Country in the company')

program.parse(process.argv)

const Company = models.Company

const addCountryToCompanies = async () => {
  const companies: Array<any> = await Company.find()

  const dataToFind: any = {
    query: {
      alpha3Code: 'ARG'
    }
  }

  const country = await CountryRepository.getCountry(dataToFind)

  for (const company of companies) {
    company.country = country._id

    await company.save()

    console.log(`${chalk.green(`Successfully: COMPANY: ${company.id}`)}`)
  }
}

;(async () => {
  try {
    const connected = await connectDb()

    if (connected) {
      const options: OptionValues = program.opts()

      if (options.add) {
        await addCountryToCompanies()
      }
    }
  } catch (error) {
    console.log(error)
  }

  process.exit()
})()
