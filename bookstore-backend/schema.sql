-- ============================================================
-- Bookstore Database Schema
-- Run: psql -U bookstore_user -d bookstore_db -f schema.sql
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255)        NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255)       NOT NULL,
  gift_points  INTEGER             NOT NULL DEFAULT 500,
  created_at   TIMESTAMP           NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255)   NOT NULL,
  author        VARCHAR(255)   NOT NULL,
  price         NUMERIC(10, 2) NOT NULL,
  image_url     TEXT,
  delivery_days INTEGER        NOT NULL DEFAULT 5,
  rating        NUMERIC(3, 1)  NOT NULL DEFAULT 0,
  stock         INTEGER        NOT NULL DEFAULT 100,
  category_id   INTEGER        REFERENCES categories(id),
  brand_id      INTEGER        REFERENCES brands(id)
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  line1      VARCHAR(255) NOT NULL,
  line2      VARCHAR(255),
  city       VARCHAR(100) NOT NULL,
  state      VARCHAR(100) NOT NULL,
  zip        VARCHAR(20)  NOT NULL,
  country    VARCHAR(100) NOT NULL,
  is_default BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Cart
CREATE TABLE IF NOT EXISTS cart (
  id       SERIAL PRIMARY KEY,
  user_id  INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  book_id  INTEGER NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id             VARCHAR(50)    PRIMARY KEY,
  user_id        INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id     INTEGER        REFERENCES addresses(id),
  payment_method VARCHAR(50)    NOT NULL,
  subtotal       NUMERIC(10, 2) NOT NULL,
  gift_discount  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total          NUMERIC(10, 2) NOT NULL,
  status         VARCHAR(50)    NOT NULL DEFAULT 'Processing',
  created_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL         PRIMARY KEY,
  order_id   VARCHAR(50)    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id    INTEGER        REFERENCES books(id),
  title      VARCHAR(255)   NOT NULL,
  quantity   INTEGER        NOT NULL,
  price      NUMERIC(10, 2) NOT NULL
);

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO categories (name) VALUES
  ('Fiction'), ('Technology'), ('Self Help'), ('Finance'), ('History')
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name) VALUES
  ('Penguin'), ('HarperCollins'), ('Prentice Hall'), ('Vintage'),
  ('Addison-Wesley'), ('Plata Publishing'), ('Bloomsbury'), ('Grand Central')
ON CONFLICT (name) DO NOTHING;

INSERT INTO books (title, author, price, image_url, delivery_days, rating, stock, category_id, brand_id)
SELECT b.title, b.author, b.price, b.image_url, b.delivery_days, b.rating, b.stock,
       c.id AS category_id, br.id AS brand_id
FROM (VALUES
  ('Atomic Habits',          'James Clear',          19.99, 'https://via.placeholder.com/150x200?text=Atomic+Habits',    5, 4.8, 100, 'Self Help',  'Penguin'),
  ('The Alchemist',          'Paulo Coelho',          14.99, 'https://via.placeholder.com/150x200?text=The+Alchemist',    4, 4.7, 100, 'Fiction',    'HarperCollins'),
  ('Clean Code',             'Robert C. Martin',      35.99, 'https://via.placeholder.com/150x200?text=Clean+Code',       6, 4.9, 100, 'Technology', 'Prentice Hall'),
  ('Sapiens',                'Yuval Noah Harari',     22.99, 'https://via.placeholder.com/150x200?text=Sapiens',          5, 4.6, 100, 'History',    'Vintage'),
  ('The Pragmatic Programmer','David Thomas',         40.99, 'https://via.placeholder.com/150x200?text=Pragmatic',        7, 4.8, 100, 'Technology', 'Addison-Wesley'),
  ('Rich Dad Poor Dad',      'Robert Kiyosaki',       16.99, 'https://via.placeholder.com/150x200?text=Rich+Dad',         4, 4.5, 100, 'Finance',    'Plata Publishing'),
  ('Harry Potter',           'J.K. Rowling',          24.99, 'https://via.placeholder.com/150x200?text=Harry+Potter',     3, 4.9, 100, 'Fiction',    'Bloomsbury'),
  ('Think and Grow Rich',    'Napoleon Hill',         12.99, 'https://via.placeholder.com/150x200?text=Think+Grow',       5, 4.4, 100, 'Finance',    'Penguin'),
  ('Deep Work',              'Cal Newport',           18.99, 'https://via.placeholder.com/150x200?text=Deep+Work',        4, 4.7, 100, 'Self Help',  'Grand Central'),
  ('Design Patterns',        'Gang of Four',          45.99, 'https://via.placeholder.com/150x200?text=Design+Patterns',  7, 4.8, 100, 'Technology', 'Addison-Wesley')
) AS b(title, author, price, image_url, delivery_days, rating, stock, cat_name, brand_name)
JOIN categories c  ON c.name  = b.cat_name
JOIN brands     br ON br.name = b.brand_name
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = b.title);
