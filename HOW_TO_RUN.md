# How to Run — Bean & Brew

## Prerequisites

To run this application you need:

- **Node.js** (v18 or higher) — https://nodejs.org
- **PostgreSQL** (v14 or higher) — https://www.postgresql.org/download/windows/

---

## Option A — Fresh machine, nothing installed?

Use the automated setup script. It will install Node.js and PostgreSQL automatically, set everything up, and open the app in your browser.

**1. Clone the repository**
```bash
git clone https://github.com/davidkovac996/Digistore24Task.git
```

**2. Run the setup script**

Double-click **`setup.cmd`** — this is the recommended way to run the script as it bypasses PowerShell execution policy restrictions automatically.

> If you prefer PowerShell directly:
> ```powershell
> PowerShell -ExecutionPolicy Bypass -File setup.ps1
> ```

When prompted for a PostgreSQL password: press **Enter** to use the default (`postgres`), or type your existing password if PostgreSQL was already installed.

**3. Wait 5–10 minutes**

The script will:
- Install Node.js if missing
- Install PostgreSQL if missing
- Configure the environment
- Create and seed the database
- Install all dependencies
- Start both servers
- Open the browser automatically

**4. Done!**

The app will open at **http://localhost:5173**

Test admin functionalities by login as an admin.
Admin login:
- Email: `admin@brewedtrue.com`
- Password: `Admin1234!`

Test admin functionalities by login as a client.
Client login:
- Email: `davidkovac1996@gmail.com`
- Password: `David1234!`

It is possible to enter as a guest when user can shop and review home page.
No messages, orders history, contact forms and reviews.

Feel free to register you client account by using register form.
---

## Stopping the app

Close the two terminal windows that were opened by the script (or press `Ctrl+C` in each one).

---

## Troubleshooting

**Port already in use?**
If you see `EADDRINUSE: address already in use :::4000`, another process is using port 4000. Kill it with:
```powershell
netstat -ano | findstr :4000
taskkill /PID <number> /F
```
Then restart the backend.

**PostgreSQL connection error?**
Make sure PostgreSQL is running. Search for "Services" in the Windows Start menu, find `postgresql-x64-17` (or your version) and click Start.

**npm not recognized?**
Run this in PowerShell and reopen the terminal:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```



## Option B — Already have Node.js and PostgreSQL installed?

**1. Clone the repository**
```bash
git clone https://github.com/davidkovac996/Digistore24Task.git
```

**2. Configure the backend**
```bash
cd backend
copy .env.example .env
```
Open `.env` and set your PostgreSQL password:
```
DATABASE_URL=postgresql://postgres:Postgre123!@localhost:5432/brewedtrue
```

**3. Create the database and seed it**
```bash
psql -U postgres -c "CREATE DATABASE brewedtrue;"
npm install
npm run seed
```

**4. Start the backend** (leave this terminal running)
```bash
npm run dev
```

**5. Open a new terminal and start the frontend**
```bash
cd frontend
npm install
npm run dev
```

**6. Open your browser at http://localhost:5173**

Admin login:
- Email: `admin@brewedtrue.com`
- Password: `Admin1234!`

---


