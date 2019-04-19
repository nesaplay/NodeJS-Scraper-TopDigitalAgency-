const axios = require('axios')
const cheerio = require('cheerio')
const createCSVWriter = require('csv-writer').createObjectCsvWriter
const urls = require('./companies.json')
const header = require('./helpers/csvHeader')
const wait = require('./helpers/wait')

/* Fetch each company page, extract valuable data and write to .CSV */

;(async () => {
  const csvWriter = createCSVWriter({
    path: './topDigitalAgencies.csv',
    append: true,
    header,
  })
  
  const csvData = []
  let pageNum = 0

  while (pageNum <= urls.length) {
    const requests = urls.slice(pageNum, pageNum + 20).map((url, companyIndex) => {
      return new Promise(async res => {
      try {
          const { data, status } = await axios(url)
          if (!status === 200) return res()

          const $ = cheerio.load(data)
          const info = {}
        
          info.name = $('#pageTitle').text()
          info.about = $('#module-about-tab').find('.module__lead').text().trim()
          info.website = $('.hero__links').children('a').get(0) && $('.hero__links').children('a').get(0).attribs && $('.hero__links').children('a').get(0).attribs.href
      
          $('.module__sidebar').find('.col-12.col-sm-10.col-md-6.col-lg-12').each((i, el) => {
            const title = $(el).find('.accordion__label').text().toLowerCase().trim()
            const values = []
      
            if (title === 'expertise' || title === 'technology expertise') {
              $(el).find('.accordion__content').find('.accordion__col span').each((i, el) => {
                const value = el.children[2].data.trim()
                if (value) values.push(value)
              })
            } else {
              $(el).find('.accordion__content').find('.accordion__col span').each((i, el) => {
                const value = el.children[0].data.trim()
                if (value) values.push(value)
              })
            }
      
            info[title] = values.join(', ')
          })
      
          $('.module__body').children().each((i, el) => {
            if (el.name === 'h3') {
              const title = el.children[0].data.toLowerCase().trim()
              const value = $(el).next().text().trim()
      
              info[title] = value
            }
          })
      
          $('.hero__share').children().each((i, el) => {
            let title
            if (el.attribs.href) {
              if (el.attribs.href.includes('linkedin')) title = 'linkedin'
              if (el.attribs.href.includes('google')) title = 'google+'
              if (el.attribs.href.includes('facebook')) title = 'facebook'
              if (el.attribs.href.includes('twitter')) title = 'twitter'
      
              info[title] = el.attribs.href
            }
      
          })
      
          $('.hero__meta-list').find('.hero__meta-item').each((i, el) => {
            if (i === 0) (info.score = el.children[2].data.trim())
            if (i === 1) (info.membershipLevel = el.children[2].data.trim())
          })
    
          csvData.push(info)
          console.log(`Extracting company number: ${pageNum + companyIndex}`)
          res()
        } catch (e) {
          console.error('Error in company loop:', e)
          res()
        }
      })
    })

    pageNum += 20
    await Promise.all(requests)
    await wait(5000)
  }

  try {
    await csvWriter.writeRecords(csvData)
  } catch (e) {
    console.error('Error in writting files:', e)
  }
  
})().catch(console.error)
