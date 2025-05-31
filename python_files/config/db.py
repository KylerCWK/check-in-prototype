from mongoengine import connect, disconnect
from mongoengine.connection import get_connection
import os

def connect_db():
    """Establishes a connection to the MongoDB database."""
    try:
        # Check if a default connection already exists
        try:
            get_connection()
            print("MongoDB connection with alias 'default' already exists.")
            return # Exit if already connected
        except:
            # No default connection exists, proceed to connect
            pass

        mongo_uri = os.getenv('MONGO_URI')
        if not mongo_uri:
            raise ValueError("MONGO_URI environment variable not set.")

        connect(host=mongo_uri)
        print("Connected to MongoDB.")

    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        # Depending on your needs, you might want to exit or handle this error differently
        # sys.exit("Database connection failed.")

def disconnect_db():
    """Disconnects from the MongoDB database."""
    try:
        disconnect()
        print("Disconnected from MongoDB.")
    except Exception as e:
        print(f"Error disconnecting from MongoDB: {e}")


if __name__ == '__main__':
    # Example of how to use the function if you run this file directly
    if connect_db():
        print("Database connection successful.")
    else:
        print("Failed to connect to the database.")