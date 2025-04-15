const axios = require('axios');

/**
 * Test script for Apollo.io scraper API
 * This script tests the API endpoint with a sample search URL
 */
async function testScraperApi() {
  try {
    console.log('Testing Apollo.io scraper API...');
    
    // Replace with actual Apollo.io credentials for testing
    const email = 'test@example.com';
    const password = 'your_password';
    
    // Sample search URL (replace with an actual Apollo.io search URL)
    const searchUrl = 'https://app.apollo.io/#/people?qKeywords=avenue%20living&personTitles[]=ceo%20owner&sortAscending=false&sortByField=%5Bnone%5D&page=1';
    
    // Make request to the API
    const response = await axios.post('http://localhost:3000/api/scrape', 
      { searchUrl },
      { 
        headers: {
          'apollo-email': email,
          'apollo-password': password,
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
