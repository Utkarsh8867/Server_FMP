# 🛒 Farmers Market API - FMP Backend

This repository contains the backend APIs for the **Farmers Market Platform (FMP)**. The platform provides categorized access to agricultural products, enabling users to explore fruits, vegetables, grains, milk products, and more from a centralized backend.

---

## 🌐 Live API Base URL
https://server-fmp.onrender.com/api/v2/product/get-all-products

---

## 📦 Available API Endpoints

| HTTP Method | Endpoint                                     | Description                                                  |
|-------------|----------------------------------------------|--------------------------------------------------------------|
| `GET`       | `/get-all-products`                          | Fetches **all available products** from the database.        |
| `GET`       | `/get-fruits`                                | Returns a list of all available **fruits**.                  |
| `GET`       | `/get-Vegetables`                            | Returns a list of all available **vegetables**.              |
| `GET`       | `/get-grains`                                | Returns a list of all available **grains**.                  |
| `GET`       | `/milk-products`                             | Returns a list of available **milk and dairy products**.     |



---

## ⚙️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Render** (for API hosting and deployment)

---

## 🚀 Getting Started (Local Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/Utkarsh8867/Server_FMP.git
