#!/usr/bin/env node

const ApolloScraper = require('./apolloScraper');

/**
 * Command line test script for Apollo.io scraper with Google OAuth
 * This script directly tests the scraper functionality without going through the API
 */
async function testScraper() {
  // Create a new scraper instance
  const scraper = new ApolloScraper();
  
  try {
    console.log('Starting Apollo.io scraper test with Google OAuth...');
    
    // Get credentials from command line arguments
    const googleEmail = process.argv[2];
    const googlePassword = process.argv[3];
    const searchUrl = process.argv[4] || 'https://app.apollo.io/#/people?qKeywords=avenue%20living&personTitles[]=ceo&sortAscending=false&sortByField=%5Bnone%5D&page=1';
    
    if (!googleEmail || !googlePassword) {
      console.error('Error: Google email and password are required.');
      console.log('Usage: node test-direct.js <google-email> <google-password> [search-url]');
      process.exit(1);
    }
    
    console.log(`Using search URL: ${searchUrl}`);
    
    // Initialize browser
    await scraper.initialize();
    
    // Login to Apollo.io via Google OAuth
    console.log('Attempting to login with Google OAuth...');
    const loginSuccess = await scraper.login(googleEmail, googlePassword);
    
    if (!loginSuccess) {
      throw new Error('Failed to login to Apollo.io. Please check your Google credentials.');
    }
    
    console.log('Login successful! Now scraping contacts...');
    
    // Scrape contacts
    const contacts = await scraper.scrapeContacts(searchUrl);
    
    // Display results
    console.log(`Successfully scraped ${contacts.length} contacts:`);
    console.log(JSON.stringify(contacts, null, 2));
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
  } finally {
    // Clean up resources
    await scraper.close();
    console.log('Test completed and browser closed.');
  }
}

// Run the test
testScraper();
