# True Offline Mode: 200+ Student Capacity Guide

If you want to host an exam for hundreds of students using **only your laptop and a Wi-Fi router** (without any internet connection), you must run all cloud services locally on your machine. 

This guide walks you through setting up a "True Offline" environment on Windows.

> [!IMPORTANT]  
> **Prerequisites:**
> - A powerful Windows laptop (16GB RAM minimum recommended for 200+ students)
> - A Wi-Fi router (You do not need an internet subscription, just the router for local networking)

---

## 1. Install Local Database (MongoDB)

Right now, your app talks to MongoDB Atlas (in the cloud). We need to move it locally.

1. Download **MongoDB Community Server** for Windows from the [official website](https://www.mongodb.com/try/download/community).
2. Run the installer and choose **Complete Setup**.
3. Make sure "Install MongoDB as a Service" is checked. (This means the database will run silently in the background whenever your laptop is on).
4. **Update your `.env` file** in the coding-platform folder:
```env
# Change this:
# MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/examdb

# To this (your local database):
MONGODB_URI=mongodb://localhost:27017/examdb
```

---

## 2. Install Local Code Compiler (Judge0)

Right now, your app sends student code to the free RapidAPI cloud compiler. We need to run the compiler directly on your laptop using Docker.

1. Download and install **Docker Desktop for Windows** from the [official website](https://www.docker.com/products/docker-desktop/).
2. Open Docker Desktop and let the Docker Engine start.
3. Open a **new terminal/command prompt** on your laptop and run these exact commands one by one to download and start the compiler:
```bash
wget https://github.com/judge0/judge0/releases/download/v1.13.0/judge0-v1.13.0.zip
unzip judge0-v1.13.0.zip
cd judge0-v1.13.0

# Start the compiler and all its workers in the background
docker-compose up -d db redis
sleep 10s
docker-compose up -d
sleep 5s
```
4. *I have already updated your codebase's execution logic to support this!* You just need to add this line to your `.env` file:
```env
# Tell the app to use your local Docker compiler instead of the internet
JUDGE0_API_URL=http://localhost:2358
```

---

## 3. Run the App in Production Mode

If you run `npm run dev`, it is too slow for 200 students because it recompiles files on the fly. You must run it in **Production Mode**.

1. Open your terminal in the `coding-platform` folder.
2. Build the optimized application (only need to do this once, or when you change code):
```bash
npm run build
```
3. Start the blazing-fast production server:
```bash
npm start
```

---

## 4. Connect Students via Wi-Fi

Now that the App, Database, and Compiler are all running on your laptop, how do 200 students access it?

1. Connect your laptop to your Wi-Fi router.
2. Open Command Prompt and type:
```bash
ipconfig
```
3. Look for **"IPv4 Address"** under your Wi-Fi adapter. It will look something like `192.168.1.15`.
4. Tell all your students to connect to the same Wi-Fi network.
5. Tell the students to open their browser and type in your IP address with port 3000:
   - `http://192.168.1.15:3000`

### You are now running a blazing-fast, 100% offline exam platform! 
No rate limits. No internet required. Instant loading times.
