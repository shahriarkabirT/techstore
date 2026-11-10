# Voice-Powered AI Ordering System Plan

An end-to-end architectural plan and specification for integrating an AI voice assistant into the Next.js ecommerce storefront. The system listens to customers, understands natural language intent, extracts order details, collects missing information, verifies inventory/pricing via existing backend APIs, and places orders upon explicit user confirmation.

---

## 1. How the System Works

```
Customer Speaks (English / Bangla / Banglish)
       │
       ▼
Speech-to-Text (STT) Conversion
       │
       ▼
AI Intent & Entity Extraction (LLM + Structured Tool Calling)
       │
       ▼
Backend Validation (Product Search, Variant Match, Stock & Delivery Fee Check)
       │
       ▼
Follow-up Clarification (Ask for missing variant, quantity, phone, address)
       │
       ▼
Order Summary & Explicit Customer Confirmation
       │
       ▼
Order Creation via Existing Backend APIs
```

### Detailed Flow:
1. **Customer Speaks:** Customer presses the mic button and speaks naturally (e.g., *"I want to order honey nut. My name is Rahim. My address is Dhanmondi, Dhaka."*).
2. **Voice-to-Text Conversion (STT):** Audio is transcribed into text with support for English, Bangla, and Banglish.
3. **AI Decision-Making:** The AI processes the text, detects the intent (`create_order`), identifies mentioned products, and extracts customer entities (name, phone, delivery address).
4. **Catalog & Inventory Validation:** The backend searches the live product catalog and checks stock, variant options, and active pricing.
5. **Follow-Up Questions:** If items are ambiguous or missing (e.g., size, pack weight, quantity, phone number), the AI asks concise follow-up questions.
6. **Order Confirmation:** Once all required fields are validated, the assistant displays an order preview (items, subtotal, delivery charge, total, shipping details) and prompts the user for final confirmation before placing the order.

---

## 2. Recommended Technology Stack

| Layer | Recommended Technology | Purpose |
|---|---|---|
| **Frontend UI** | Next.js (React), Web Audio API / MediaRecorder | Interactive voice widget, microphone controls, live audio waveform, chat transcript, order confirmation card |
| **Speech-to-Text (STT)** | OpenAI Whisper API / Google Cloud Speech-to-Text / Web Speech API (fallback) | High accuracy transcription supporting English, Bangla, and mixed Banglish dialects |
| **AI Decision Engine** | OpenAI / Anthropic / Gemini with Function / Tool Calling | Natural Language Understanding (NLU), structured output extraction, conversational state management |
| **Backend & APIs** | Next.js App Router API Routes (`/api/ai/order-assistant`, `/api/orders`) | Server-side validation, product search, cart calculation, order creation, rate limiting |
| **Database** | MongoDB (Mongoose models: `Product`, `Order`, `Customer`, `Settings`) | Catalog data, customer records, inventory, and order persistence |

---

## 3. What the AI Extracts (Structured Data)

When a customer speaks:
> *"I want to order honey nut. My name is Rahim. My address is Dhanmondi, Dhaka."*

The AI parses the utterance into structured parameters:

```json
{
  "intent": "create_order",
  "product_search": "honey nut",
  "customer": {
    "name": "Rahim",
    "phone": null,
    "address": "Dhanmondi, Dhaka"
  },
  "quantity": null,
  "variant": null,
  "product_id": null,
  "status": "collecting_information"
}
```

> **Key Rule:** The AI does **not** hallucinate or invent product IDs, prices, or inventory status. It passes search terms to backend tools, which perform exact or fuzzy matches against actual database records.

---

## 4. Decision-Making & Validation Logic

The AI follows strict server-side guarded workflows:

1. **Product Identification:**
   - Query catalog via `search_products`.
   - If 0 matches: Politely inform the customer and suggest closest matching items.
   - If multiple matches: Present options/variants (e.g., *"We have 500g and 1kg jars. Which one would you prefer?"*).
2. **Quantity, Price & Stock Verification:**
   - Quantities and prices must be retrieved from backend product models.
   - Verify stock availability before proceeding.
3. **Customer Details Completeness:**
   - Required fields for checkout in Bangladesh:
     - Full Name
     - Valid 11-digit Phone Number (`01XXXXXXXXX`)
     - Delivery Address (District/Area for delivery fee calculation)
4. **Order Confirmation Safeguard:**
   - Show exact breakdown: Item price + Delivery fee = Total Payable.
   - Place the order **only** after the customer explicitly confirms (via voice or one-click button).
   - Prevent duplicate order submissions using idempotency tokens.

---

## 5. System Architecture

```
Frontend (Storefront / Client)
    │
    ├── Microphone Input & Audio Recording (Web Audio API)
    ├── Speech-to-Text (Whisper / Cloud STT)
    ├── Live Conversation Drawer / Floating Widget
    └── Order Confirmation Modal / Card
            │
            ▼
Next.js Server API Routes (`/api/voice-assistant/*`)
    │
    ├── Conversation Session State Handler
    ├── AI Tool Calling Engine:
    │     ├── `search_products(query)`
    │     ├── `check_stock_and_variant(productId, variantId)`
    │     ├── `calculate_order_totals(items, district)`
    │     └── `create_order(payload)`
    │
    ▼
Database & Integrations
    │
    ├── MongoDB (Products, Orders, Customers)
    └── Couriers (Steadfast / Pathao / RedX delivery fee validation)
```

---

## 6. Implementation Guardrails & Best Practices

- **Multilingual Support:** Support English, Bangla script (বাংলা), and phonetic Banglish (e.g., *"Ami 1ta jar nite chai"*).
- **Graceful Clarifications:** Keep conversational turns short and focused on one missing detail at a time.
- **Fail-Safe Fallbacks:** If the AI fails to parse voice after 2 attempts, offer standard text input or direct links to product pages.
- **Fraud & Bot Prevention:** Enforce Upstash Redis rate limiting and phone number validation before triggering order creation.
- **Performance & Latency:** Start with a push-to-talk (press-to-speak) model to ensure reliable transcription before evaluating real-time full-duplex WebRTC streaming.

---

## 7. Open Design Decisions

1. **Language Scope:**
   - English only
   - Bangla only
   - English + Bangla + Banglish *(Recommended for Bangladesh ecommerce)*
2. **Voice Interaction Style:**
   - Push-to-talk (Press mic, speak, release to process) *(Recommended for MVP)*
   - Continuous real-time voice streaming with AI speech responses (TTS)
3. **Order Creation Trigger:**
   - Explicit customer confirmation button or verbal *"Yes, confirm order"* *(Recommended)*
   - Automatic creation once all information is captured
4. **Backend Architecture:**
   - Built directly into Next.js App Router API routes (`/api/...`) connecting to existing Mongoose models.
