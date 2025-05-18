# Apollo.io Scraper API with Google OAuth

A Node.js application that provides an API for scraping contact information from Apollo.io search results using Google OAuth authentication.

## Issues
  Temporary solution by importing cookies

  
## Setting up Docker (if !Windows or issues)
  Download docker at https://www.docker.com/products/docker-desktop/
  CD into the scrapper folder
  docker build --network=host -t apolloscraper .
  docker run -p 3000:3000 apolloscraper


## Setting up Cookie
https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm 
Export as JSON
paste it into cookies.json

## Features

- Automated login to Apollo.io using Google OAuth authentication
- Scrapes contact information from Apollo.io search results
- Returns data in JSON format
- Secure API with proper error handling
- Lightweight Express server
- Robust scraping with multiple selector fallbacks

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Usage

### Starting the Server

```bash
npm start
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

### API Endpoints

#### Scrape Contacts

**Endpoint:** `POST /api/scrape`

**Headers:**
- `google-email`: Your Google account email
- `google-password`: Your Google account password
- `Content-Type`: application/json

**Request Body:**
```json
{
  "searchUrl": "https://app.apollo.io/#/people?qKeywords=avenue%20living&personTitles[]=ceo&sortAscending=false&sortByField=%5Bnone%5D&page=1"
}
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "contacts": [
    {
      "name": "John Doe",
      "jobTitle": "CEO",
      "company": "Example Company",
      "email": "john.doe@example.com",
      "phone": "+1 (555) 123-4567",
      "linkedinUrl": "https://www.linkedin.com/in/johndoe"
    },
    ...
  ]
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

#### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok"
}
```

## Example Usage with cURL

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "google-email: your-email@gmail.com" \
  -H "google-password: your-google-password" \
  -H "Content-Type: application/json" \
  -d '{"searchUrl": "https://app.apollo.io/#/people?qKeywords=avenue%20living&personTitles[]=ceo&sortAscending=false&sortByField=%5Bnone%5D&page=1"}'
```

## Example Usage with JavaScript/Axios

```javascript
const axios = require('axios');

async function scrapeApollo() {
  try {
    const response = await axios.post('http://localhost:3000/api/scrape', 
      { 
        searchUrl: 'https://app.apollo.io/#/people?qKeywords=avenue%20living&personTitles[]=ceo&sortAscending=false&sortByField=%5Bnone%5D&page=1' 
      },
      { 
        headers: {
          'google-email': 'your-email@gmail.com',
          'google-password': 'your-google-password',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}
```

## Direct Testing

For direct testing without using the API, you can use the included test script:

```bash
node test-direct.js <google-email> <google-password> [search-url]
```

This will run the scraper directly and output the results to the console.

## Security Considerations

- This application handles Google login credentials. It's recommended to:
  - Use HTTPS in production
  - Consider implementing a more secure authentication method for the API itself
  - Never store Google credentials in the code
  - Consider using environment variables for sensitive information
  - Be aware that automated login to Google may violate their terms of service

## Limitations

- The scraper is dependent on Apollo.io's and Google's HTML structure. If they change their websites, the scraper may need to be updated.
- Apollo.io may implement measures to prevent scraping. Use responsibly and in accordance with their terms of service.
- The scraper only extracts contacts from the first page of results. Pagination would need to be implemented for more results.
- Google may detect automated login attempts and require CAPTCHA verification or additional security measures.

## License

ISC
# browser-apollo-scrapper
