# 💰 Smart Expense Manager (ExpenseIQ)
> Indian Rupee (₹ INR) based personal finance tracker — Node.js + Express + PostgreSQL + EJS

## Features
- JWT authentication (register/login with bcrypt)
- Track income & expenses with categories
- Monthly budget setting and alerts
- Dashboard with charts (Chart.js)
- CSV export for monthly reports
- Dark theme UI built for Indian users (₹ INR formatting)
- PM2 + Nginx production ready

---

## 🗂 Folder Structure
```
expense-manager/
├── app.js                    # Express entry point
├── config/db.js              # pg Pool connection
├── controllers/              # Business logic
│   ├── authController.js
│   ├── dashboardController.js
│   ├── transactionController.js
│   ├── categoryController.js
│   └── budgetController.js
├── middleware/authMiddleware.js  # JWT guard
├── routes/                   # Express routers
├── views/                    # EJS templates
│   ├── partials/sidebar.ejs
│   ├── dashboard.ejs
│   ├── transactions.ejs
│   ├── budgets.ejs
│   ├── categories.ejs
│   ├── login.ejs
│   └── register.ejs
├── public/css/style.css      # Dark theme CSS
├── schema.sql                # DB setup script
├── nginx.conf                # Nginx reverse proxy
├── ecosystem.config.js       # PM2 config
└── .env.example
```

---

## 🚀 Deployment on Ubuntu Instances

### 1️⃣ DB Server Setup

```bash
# Install PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Create DB and user
sudo -u postgres psql
CREATE DATABASE expense_db;
CREATE USER expense_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE expense_db TO expense_user;
\q

# Run schema
psql -U expense_user -d expense_db -f /path/to/schema.sql

# Allow App Server private IP in pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add this line (replace with your app server private IP):
# host    expense_db    expense_user    10.0.0.5/32    md5

# Allow in postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = 'localhost,<DB_PRIVATE_IP>'

sudo systemctl restart postgresql
```

### 2️⃣ App Server Setup

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Clone your repo
git clone <your-repo-url> /var/www/expense-manager
cd /var/www/expense-manager

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env
# Fill in DB_HOST (private IP of DB server), DB_PASSWORD, JWT_SECRET

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # follow the command it outputs
```

### 3️⃣ Nginx Setup

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/expense-manager
sudo ln -s /etc/nginx/sites-available/expense-manager /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Edit domain name
sudo nano /etc/nginx/sites-available/expense-manager
# Change: server_name yourdomain.com;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 4️⃣ SSL with Certbot (Optional but recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | App port | `3000` |
| `DB_HOST` | PostgreSQL host (private IP) | `10.0.0.5` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `expense_db` |
| `DB_USER` | DB username | `expense_user` |
| `DB_PASSWORD` | DB password | `strong_pass` |
| `JWT_SECRET` | JWT signing key (32+ chars) | `random_string` |
| `NODE_ENV` | Environment | `production` |

---

## 📊 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Dashboard |
| GET/POST | `/auth/register` | Register |
| GET/POST | `/auth/login` | Login |
| GET | `/auth/logout` | Logout |
| GET/POST | `/transactions` | List/Add transactions |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |
| GET | `/transactions/export` | Export CSV |
| GET/POST | `/budgets` | List/Set budgets |
| PUT | `/budgets/:id` | Update budget |
| GET/POST | `/categories` | List/Add categories |
| DELETE | `/categories/:id` | Delete category |

---

## 💡 PM2 Commands

```bash
pm2 list                    # Show running apps
pm2 logs expense-app        # View logs
pm2 restart expense-app     # Restart
pm2 stop expense-app        # Stop
pm2 monit                   # Monitor CPU/RAM
```
