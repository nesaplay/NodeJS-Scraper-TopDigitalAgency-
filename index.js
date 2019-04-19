const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs-extra')

/* Get company page urls and store in JSON */

;(async () => {
  let pageNum = 1
  const companies = []

  while (pageNum < 320) {
    const url = `https://topdigital.agency/agency/?fwp_paged=${pageNum}`
    const { data } = await axios(url)
    const $ = cheerio.load(data)
  
    $('.media__title a').each((_, el) => {
      companies.push(el.attribs.href)
    })
    pageNum++
  }

  await fs.writeJSON('./companies.json', companies)
})()
