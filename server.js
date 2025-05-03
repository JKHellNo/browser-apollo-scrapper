const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const ApolloScraper = require('./apolloScraper');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Store active scraper instances
const scraperInstances = {};

// Generate a unique ID for each scraper instance
function generateScraperId() {
  return `scraper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware to validate required headers
function validateAuthHeaders(req, res, next) {
  const googleEmail = req.headers['google-email'];
  const googlePassword = req.headers['google-password'];
  
  if (!googleEmail || !googlePassword) {
    return res.status(400).json({
      error: 'Missing authentication headers. Please provide google-email and google-password headers.'
    });
  }
  
  next();
}

// API endpoint to scrape Apollo.io contacts
app.post('/api/scrape', validateAuthHeaders, async (req, res) => {
  const { searchUrl } = req.body;
  const googleEmail = req.headers['google-email'];
  const googlePassword = req.headers['google-password'];
  
  // Validate search URL
  if (!searchUrl) {
    return res.status(400).json({ error: 'Missing searchUrl in request body' });
  }
  
  if (!searchUrl.startsWith('https://app.apollo.io/')) {
    return res.status(400).json({ error: 'Invalid Apollo.io URL' });
  }
  
  // Create a new scraper instance
  const scraperId = generateScraperId();
  const scraper = new ApolloScraper();
  scraperInstances[scraperId] = scraper;
  
  try {
    console.log(`Starting scraping job`);
    
    // Initialize browser
    await scraper.initialize();
    
    // Login to Apollo.io via Google OAuth
    const loginSuccess = await scraper.login(googleEmail, googlePassword);
    if (!loginSuccess) {
      throw new Error('Failed to login to Apollo.io. Please check your credentials.');
    }
    
    // Scrape contacts
    const contacts = await scraper.scrapeContacts(searchUrl);
    
    // Clean up resources
    await scraper.close();
    delete scraperInstances[scraperId];
    
    // Return scraped contacts
    return res.status(200).json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    console.error(`Scraping error: ${error.message}`);
    
    // Clean up resources on error
    try {
      if (scraperInstances[scraperId]) {
        await scraper.close();
        delete scraperInstances[scraperId];
      }
    } catch (cleanupError) {
      console.error(`Error during cleanup: ${cleanupError.message}`);
    }
    
    return res.status(400).json({
      error: error.message || 'An error occurred during scraping'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close all active scraper instances
  for (const id in scraperInstances) {
    try {
      await scraperInstances[id].close();
    } catch (error) {
      console.error(`Error closing scraper ${id}: ${error.message}`);
    }
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Apollo.io scraper API running on port ${PORT}`);
});

module.exports = app; // For testing purposes
