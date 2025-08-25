# Resource Catalog Service

This project implements a **Resource Catalog Service** that allows for the management, discovery, and rating of learning resources. It's designed as a microservice to provide a central repository for various types of educational content, along with user-generated ratings and feedback.

## ✨ Features

- **Resource Management**: Create, retrieve, update, and delete learning resources.
- **Resource Discovery**: Search and filter resources based on various criteria (e.g., type, author).
- **Ratings**: Users can rate resources (1-5 stars).
- **Feedback**: Users can provide textual feedback on resources.
- **Skill Tagging**: Resources can be associated with relevant skill tags for better categorization and search.

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js (or similar, assuming a JavaScript/TypeScript backend based on previous interactions)
- **Database**: Placeholder (e.g., MongoDB, PostgreSQL, or a simple JSON file structure for local development)
- **Testing**: Jest (or similar, if unit/integration tests are present)
- **API Client**: Postman (for API testing)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: [Download & Install Node.js](https://nodejs.org/en/download/) (LTS version recommended)
- **npm** (Node Package Manager): Comes bundled with Node.js.
- **Git**: [Download & Install Git](https://git-scm.com/downloads)
- **Postman**: [Download & Install Postman Desktop App](https://www.postman.com/downloads/)

### Installation

1. **Clone the Repository:** First, clone the project repository to your local machine:
    
    ```
    git clone <repository_url>
    cd resource-catalog-service # Replace with your actual project directory name
    
    ```
    
2. **Install Dependencies:** Navigate into the project directory and install the necessary Node.js packages:
    
    ```
    npm install
    
    ```
    
3. **Set up Test Data (Optional but Recommended):** If you're using a local file-based data store or need initial data for your database, you can use the test data provided previously. Create a `data` directory (if it doesn't exist) in your project root and place the `resources.json`, `ratings.json`, and `feedback.json` files inside it.
    
    ```
    .
    ├── src/
    ├── data/
    │   ├── resources.json
    │   ├── ratings.json
    │   └── feedback.json
    └── package.json
    # ... other project files
    
    ```
    
4. **Start the Service:** Run the service using the start script defined in your `package.json`:
    
    ```
    npm start
    
    ```
    
    The service should now be running, typically on `http://localhost:5002` (check your server's output for the exact port).
    

## 🧪 Running Tests

(If your project includes unit or integration tests)

To run the automated tests for the service:

```
npm test

```

## 🌐 API Testing with Postman

A Postman Collection has been generated to help you test the API endpoints.

1. **Import the Collection:**
    - Open Postman.
    - Click on **"Import"** in the top left.
    - Choose **"Raw text"** and paste the JSON content of the Postman Collection (provided separately).
    - Click **"Continue"** and then **"Import"**.
2. **Set up the Base URL:**
    - The collection uses an environment variable `{{baseURL}}`. By default, it's set to `http://localhost:5002`. If your service runs on a different port, update this variable in your Postman environment settings.
    - To do this, click the **"Environments"** dropdown (usually top right), select **"Manage Environments"**, then click **"Add"** or edit an existing one. Add/update the `baseURL` variable with the correct URL.
3. **Send Requests:**
    - You can now navigate through the collection in Postman's sidebar.
    - Select any request and click **"Send"** to execute it and view the response.
    - Remember to adjust **resource IDs** in the URL paths for requests like `GET /resources/:id`, `PUT /resources/:id`, `DELETE /resources/:id`, `POST /resources/:id/ratings`, `POST /resources/:id/feedback`, `PUT /resources/:resourceId/feedback/:feedbackId`, and `DELETE /resources/:resourceId/feedback/:feedbackId` to match existing IDs from your test data.