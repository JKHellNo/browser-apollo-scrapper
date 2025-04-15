const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const path = require('path');


// Ensure Puppeteer installs the browser before launching
const installBrowser = async () => {
  const puppeteer = require('puppeteer');
  try {
    // This will ensure Puppeteer installs the necessary browser
    await puppeteer.install();
    console.log('Chrome has been installed');
  } catch (error) {
    console.error('Failed to install Chrome:', error.message);
  }
};

// Optional: tweak stealth settings
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
stealth.enabledEvasions.delete('media.codecs');

puppeteer.use(stealth);
puppeteer.use(AnonymizeUAPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
/**
 * Apollo.io scraper service
 * Handles login and data extraction from Apollo.io search results
 */
class ApolloScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    this.page = await this.browser.newPage();
    
    // Set viewport to a reasonable size
    await this.page.setViewport({ width: 1280, height: 800 });
    
    // Enable request interception for better performance
    await this.page.setRequestInterception(true);
    
    // Skip unnecessary resources to speed up page loading
    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  /**
   * Login to Apollo.io with Google OAuth
   * @param {string} googleEmail - Google account email
   * @param {string} googlePassword - Google account password
   * @returns {Promise<boolean>} - Login success status
   */
  async login(googleEmail, googlePassword) {
    try {
      console.log('Starting Google OAuth login process for Apollo.io...');
      
      // Navigate to Apollo.io login page
      await this.page.goto('https://app.apollo.io/#/login', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for "Log In with Google" button to be visible
      // Wait for the element by polling until it’s available
      await this.page.waitForFunction(() => {
        return document.evaluate(
          "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'log in with google')]",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue !== null;
      }, { timeout: 15000 });

      // Use evaluateHandle to get the element
      const googleButtonHandle = await this.page.evaluateHandle(() => {
        const xpath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'log in with google')]";
        return document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
      });

      // Convert the handle to an element and click it if found
      const element = googleButtonHandle.asElement();
      if (element) {
        console.log('Google login button found. Clicking it...');
        await element.click();
      } else {
        throw new Error("Google login button not found via XPath evaluation.");
      }
      
      // Wait for Google login page to load
      await this.page.waitForSelector('input[type="email"]', { 
        visible: true,
        timeout: 10000
      });
      
      // Enter Google email
      console.log('Entering Google email...');
      await this.page.type('input[type="email"]', googleEmail);
      
      // Wait for and click the "Next" button using XPath
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Clicking 'Next' button...");
      await this.page.waitForSelector('#identifierNext', { visible: true, timeout: 10000 });
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        this.page.click('#identifierNext')
      ]);

      // Wait a few seconds to let the page update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // // 🖼️ Screenshot for debugging
      // await this.page.screenshot({ path: 'after_email_click.png' });
      // console.log('Saved screenshot: after_email_click.png');

      // // 📄 Print page content to help debug
      // const currentHTML = await this.page.content();
      // console.log('=== PAGE HTML START ===');
      // console.log(currentHTML.substring(0, 3000)); // print just the start so it doesn't overload
      // console.log('=== PAGE HTML END ===');

      // Wait for password field
      await this.page.waitForSelector('input[type="password"], div[jsname="B34EJ"]', { visible: true, timeout: 15000 });
      
      
      // Enter Google password
      console.log('Entering Google password...');
      await this.page.type('input[type="password"]', googlePassword);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait for and click the 'Next' or 'Sign In' button for password
      await this.page.waitForSelector('#passwordNext', { 
        visible: true, 
        timeout: 10000 
      });
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
        this.page.click('#passwordNext')
      ]);
   
      
      console.log('Successfully logged in to Apollo.io via Google OAuth');
      return true;
    } catch (error) {
      console.error('Google OAuth login error:', error.message);
      return false;
    }
  }

  /**
   * Scrape contact data from Apollo.io search results page
   * @param {string} searchUrl - Apollo.io search URL
   * @returns {Promise<Array>} - Array of contact data objects
   */
  async scrapeContacts(searchUrl) {
    try {
      console.log(`Navigating to search URL: ${searchUrl}`);
      
      // Navigate to the search URL
      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for page to load
      console.log('Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 10000));


// STEP 1: Scrape static info
  const contacts = await this.page.evaluate(() => {
  const rows = document.querySelectorAll('.zp_tFLCQ[role="rowgroup"] > div[role="row"]');
  const results = [];

  rows.forEach(row => {
    const name = row.querySelector('[data-testid="contact-name-cell"] a')?.innerText || null;
    const company = row.querySelector('a[href*="/organizations/"] span.zp_xvo3G')?.innerText || null;
    const linkedin = row.querySelector('a[href*="linkedin.com"]')?.href || null;
    const title = row.querySelector('button span.zp_FEm_X')?.innerText || null;

    results.push({ name, title, company, linkedin });
  });

  return results;
});


// // STEP 2: Add emails by interacting with the page      #handle buttons that appear
// const rowHandles = await this.page.$$('.zp_tFLCQ[role="rowgroup"] > div[role="row"]');

// for (let i = 0; i < rowHandles.length; i++) {
//   const row = rowHandles[i];
//   await row.evaluate(r => r.scrollIntoView({ behavior: 'smooth', block: 'center' }));

//   const emailButton = await row.$('button span.zp_tZMYK');
//   let email = null;

//   if (emailButton) {
//     const buttonText = await (await emailButton.getProperty('innerText')).jsonValue();

//     if (buttonText.trim() === 'Access email') {
//       try {
//         await emailButton.click();
//         await this.page.waitForFunction(
//           row => /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(row.innerText),
//           { timeout: 3000 },
//           row
//         );
//       } catch (err) {
//         console.warn(`Email for contact ${contacts[i].name} did not load in time.`);
//       }
//     }
//   }

//   // Try to get the email after click
//   email = await row.evaluate(el => {
//     const match = el.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//     return match ? match[0] : null;
//   });

//   contacts[i].email = email;
// }

console.log(contacts);


      // Log results and take a screenshot for debugging if needed
      console.log(`Scraped ${contacts.length} contacts from search results`);
      
      // If no contacts were found, try to take a screenshot for debugging
      if (contacts.length === 0) {
        try {
          console.log('No contacts found, taking screenshot for debugging...');
          await this.page.screenshot({ path: 'apollo-search-debug.png' });
          console.log('Debug screenshot saved as apollo-search-debug.png');
          
          // Try to get page HTML for debugging
          const pageContent = await this.page.content();
          console.log('Page title:', await this.page.title());
          console.log('Current URL:', this.page.url());
        } catch (screenshotError) {
          console.error('Error taking debug screenshot:', screenshotError.message);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return contacts;
    } catch (error) {
      console.error('Error scraping contacts:', error.message);
      throw new Error(`Failed to scrape contacts: ${error.message}`);
    }
  }

  /**
   * Close browser and clean up resources
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = ApolloScraper;
