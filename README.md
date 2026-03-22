# FreshMart-Retail-Industry

# FreshMart - Smart Grocery Retail Store Application

A full-stack smart retail grocery application that serves as a digital assistant for physical grocery stores. Built with modern web technologies to provide an intelligent shopping experience for customers and comprehensive analytics for store managers.

##  Features

### Customer Portal
- **AI-Powered Chatbot**: Intelligent assistant that helps customers find items, check prices, and get recipe ingredient lists
- **Store Navigation**: Browse items by floor and rack with visual store layout
- **Smart Search**: Search items by name or category across all floors
- **Discount Filtering**: Find items with active discounts
- **Recipe Assistance**: Get ingredient lists and prices for popular recipes (cake, biryani, curry, etc.)

### Manager Portal
- **Inventory Management**: Add, edit, and delete items with images and pricing
- **Sales Analytics**: Comprehensive dashboard with charts and metrics
- **Customer Insights**: Track customer behavior and purchase history
- **Performance Metrics**: Most/least sold items, floor-wise and rack-wise sales

### Store Structure
- **Multi-Floor Layout**: Ground floor, 1st floor, 2nd floor, etc.
- **Rack Organization**: Each floor contains multiple racks with 10+ items each
- **1000+ Items**: Complete grocery inventory including vegetables, fruits, spices, snacks, beverages, and household items

##  Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack React Query** for data fetching
- **Wouter** for routing
- **Recharts** for analytics charts
- **Framer Motion** for animations

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** database with Drizzle ORM
- **Server-Sent Events (SSE)** for real-time AI chatbot
- **Passport.js** for authentication
- **OpenAI API** for AI chatbot functionality

### Development Tools
- **Drizzle Kit** for database migrations
- **TypeScript** for type safety
- **ESLint** and **Prettier** for code quality

##  Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone 
   cd Smart-Store-Finder-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a PostgreSQL database named `smart_store`
   - Update the database connection string in `package.json` scripts or create a `.env` file

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/smart_store
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

##  Project Structure

```
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   └── ...
├── server/                # Backend Express server
│   ├── routes.ts          # API routes
│   ├── db.ts             # Database configuration
│   ├── storage.ts        # File storage utilities
│   └── ...
├── script/                # Build and utility scripts
├── shared/                # Shared types and schemas
└── attached_assets/       # Project documentation
```

##  API Endpoints

### Items
- `GET /api/items` - Get all items
- `POST /api/items` - Add new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Customers
- `GET /api/customers` - Get customer list
- `GET /api/customers/:id` - Get customer details

### Sales
- `GET /api/sales` - Get sales data
- `POST /api/sales` - Record new sale

### AI Chatbot
- `POST /api/chat` - Send message to AI assistant

##  UI/UX Design

- **Clean Grocery Store Theme**: Authentic retail store appearance
- **Responsive Design**: Works on desktop and mobile devices
- **Card-Based Layout**: Modern, organized item display
- **Smooth Animations**: Enhanced user experience with Framer Motion
- **Intuitive Navigation**: Easy floor and rack browsing

##  AI Chatbot Features

The AI assistant can help customers with:
- **Item Location**: "Where is sugar?" → "Ground Floor → Rack 2"
- **Price Information**: "How much does basmati rice cost?"
- **Discount Queries**: "What discounts are running?"
- **Recipe Ingredients**: "I want to prepare cake" → Lists ingredients with prices
- **Shopping Assistance**: General shopping queries and recommendations

##  Analytics Dashboard

Manager dashboard includes:
- **Sales Charts**: Daily sales, floor-wise, rack-wise performance
- **Item Performance**: Most and least sold items with images
- **Customer Analytics**: Total customers, regular customers, purchase history
- **Inventory Insights**: Stock levels and sales velocity

##  Database Schema

The application uses PostgreSQL with the following main tables:
- `items` - Product catalog with images, prices, discounts
- `customers` - Customer information and login details
- `sales` - Transaction records
- `floors` - Store floor layout
- `racks` - Rack organization within floors

##  Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

##  Item Categories

The store includes authentic grocery categories:
- **Vegetables**: Tomato, onion, potato, carrot, etc.
- **Fruits**: Apple, banana, orange, mango, grapes
- **Spices & Masalas**: Chilli powder, turmeric, garam masala
- **Snacks**: Kurkure, Lays, biscuits, chocolates
- **Beverages**: Sprite, Coke, Pepsi (with correct branding)
- **Dairy**: Milk, curd, butter, cheese
- **Grains**: Basmati rice, wheat, various rice varieties
- **Oils**: Sunflower, groundnut, coconut oil
- **Personal Care**: Soaps, shampoos, face creams
- **Household**: Cleaning products, baby care, stationery

##  Key Features

- **Real-time AI Assistance**: Streaming responses via Server-Sent Events
- **Accurate Product Images**: Correctly mapped images for all items
- **Multi-floor Store Layout**: Realistic physical store representation
- **Comprehensive Analytics**: Business intelligence for store managers
- **Responsive Design**: Seamless experience across devices
- **Type-Safe Development**: Full TypeScript implementation

##  License

This project is licensed under the MIT License.

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

