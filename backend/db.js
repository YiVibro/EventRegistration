// index.js
import { MongoClient } from 'mongodb';

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

try {
  // Use top-level await to connect
  await client.connect();
  console.log("Connected successfully to MongoDB!");
  
  const db = client.db('myDatabase');
  // Perform your database operations here...

} catch (error) {
  console.error("Connection failed:", error);
} finally {
  // Optional: Close connection when done
  // await client.close(); 
}
    