# RFM + OpenWA WhatsApp Campaign System (Windows)

## Requirements
- Node.js (https://nodejs.org/)
- Python 3.10+
- Chrome installed
- Your own WhatsApp account

## Step 1: Set up OpenWA
```bash
npm install -g @open-wa/wa-automate
npx @open-wa/wa-automate --create-api
```
- Scan the QR code using WhatsApp on your phone
- Keep the OpenWA window running

## Step 2: Set up FastAPI
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## Step 3: Upload `sample-transactions.csv` via your frontend
## Step 4: Trigger campaigns by segment — watch WhatsApp send messages!
