const axios = require('axios');

/**
 * Test script for Apollo.io scraper API with Google OAuth
 * This script tests the API endpoint with a sample search URL
 */
async function testScraperApi() {
  try {
    console.log('Testing Apollo.io scraper API with Google OAuth...');
    
    // Get credentials from command line arguments
    const googleEmail = process.argv[2];
    const googlePassword = process.argv[3];
    const searchUrl = process.argv[4] || 'https://app.apollo.io/#/people?qKeywords=avenue%20living&personTitles[]=ceo&sortAscending=false&sortByField=%5Bnone%5D&page=1';
    
    if (!googleEmail || !googlePassword) {
      console.error('Error: Google email and password are required.');
      console.log('Usage: node test-google-oauth.js <google-email> <google-password> [search-url]');
      process.exit(1);
    }
    
    console.log(`Using search URL: ${searchUrl}`);
    
    // Make request to the API
    const response = await axios.post('http://localhost:3000/api/scrape', 
      { searchUrl },
      { 
        headers: {
          'google-email': googleEmail,
          'google-password': googlePassword,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Log the response
    console.log('API Response Status:', response.status);
    console.log('Contacts found:', response.data.count);
    console.log('First few contacts:', JSON.stringify(response.data.contacts.slice(0, 3), null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed with error:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testScraperApi();
