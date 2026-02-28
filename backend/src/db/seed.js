require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('./index');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Schema applied');
}

// ── Users ────────────────────────────────────────────────────────────────────

async function seedUsers() {
  const { rows } = await query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) > 0) {
    console.log('⏭  Users already exist, skipping.');
    return;
  }

  const adminHash  = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin1234!', 12);
  const davidHash  = await bcrypt.hash('David1234!', 12);
  const saraHash   = await bcrypt.hash('Sara1234!', 12);

  await query(
    `INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
    ['00442a80-4eeb-4dae-86e3-ee60fdf1b2d7', (process.env.ADMIN_EMAIL || 'admin@brewedtrue.com').toLowerCase(), adminHash]
  );
  await query(
    `INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, 'client')`,
    ['4576fa47-8557-41cf-8194-798cec1e84fd', 'davidkovac1996@gmail.com', davidHash]
  );
  await query(
    `INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, 'client')`,
    ['58d177d0-5e28-4d00-adf2-ca7126c32bc6', 'sarakovac1998@gmail.com', saraHash]
  );

  console.log('✅ Users seeded (admin + 2 clients)');
}

// ── Products ─────────────────────────────────────────────────────────────────

async function seedProducts() {
  const { rows } = await query('SELECT COUNT(*) FROM products');
  if (parseInt(rows[0].count) > 0) {
    console.log('⏭  Products already exist, skipping.');
    return;
  }

  const products = [
    {
      id: '76f6749a-c8a1-4b04-8b48-ecaf014b8728',
      name: 'Ethiopian Yirgacheffe',
      price_cents: 1701,
      weight_grams: 250,
      quantity: 9,
      image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjB7L41KigUerSbqmokEG9tYKmZNxZoqc9ng&s',
    },
    {
      id: 'a1fd6984-ea15-409e-aac0-75090d5e09be',
      name: 'Colombian Supremo',
      price_cents: 1499,
      weight_grams: 500,
      quantity: 0,
      image_url: 'https://lifecoffeeco.org/cdn/shop/files/BrownOpeningSoonCoffeeShopInstagramPost_5.5x4.25in_2b373c36-1461-4a29-8575-88e6132a6f92.jpg?v=1699416301',
    },
    {
      id: '2e052197-f95e-4563-8aec-9c3191fc6844',
      name: 'Sumatra Mandheling',
      price_cents: 1599,
      weight_grams: 250,
      quantity: 5,
      image_url: 'https://cdn.shopify.com/s/files/1/1201/3604/files/wmed-168Sumatra.jpg?v=1762457432&width=592&height=380&crop=center',
    },
    {
      id: '59f27f3f-8771-4168-857f-023d17d918aa',
      name: 'Guatemala Antigua',
      price_cents: 1799,
      weight_grams: 250,
      quantity: 7,
      image_url: 'https://www.acoustic.coffee/cdn/shop/products/GuatemalaFlag.png?v=1667048090&width=1946',
    },
    {
      id: 'd03a5f7e-ee9a-4f62-826f-95c57bbbd278',
      name: 'Kenya AA',
      price_cents: 1899,
      weight_grams: 500,
      quantity: 12,
      image_url: 'https://blackchickencoffee.com/wp-content/uploads/2015/10/p-507-KenyaAA-e1458420376826.jpg',
    },
  ];

  for (const p of products) {
    await query(
      `INSERT INTO products (id, name, price_cents, weight_grams, quantity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [p.id, p.name, p.price_cents, p.weight_grams, p.quantity, p.image_url]
    );
  }
  console.log(`✅ Seeded ${products.length} products`);
}

// ── Orders + Order Items ──────────────────────────────────────────────────────

async function seedOrders() {
  const { rows } = await query('SELECT COUNT(*) FROM orders');
  if (parseInt(rows[0].count) > 0) {
    console.log('⏭  Orders already exist, skipping.');
    return;
  }

  const orders = [
    {
      id: 'f452876e-1f17-463f-ba12-e8d1aff7cbdd',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: 'digistore24', discount_cents: 3718, subtotal_cents: 37178, total_cents: 33460,
      payment_method: 'cash', is_read: true, is_guest: false,
      created_at: '2026-02-27T12:51:03.404Z',
    },
    {
      id: 'bc7a46ef-0020-493e-a528-7fc391a9f893',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: 'digistore24', discount_cents: 1339, subtotal_cents: 13392, total_cents: 12053,
      payment_method: 'cash', is_read: true, is_guest: false,
      created_at: '2026-02-27T12:52:12.034Z',
    },
    {
      id: '70ad493c-2aa5-4b9d-be3f-2566c386b060',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: 'digistore24', discount_cents: 600, subtotal_cents: 5997, total_cents: 5397,
      payment_method: 'cash', is_read: true, is_guest: false,
      created_at: '2026-02-27T12:57:39.533Z',
    },
    {
      id: 'bec21f16-93ea-4af8-811b-83018ca36923',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: 'digistore24', discount_cents: 810, subtotal_cents: 8095, total_cents: 7285,
      payment_method: 'cash', is_read: true, is_guest: false,
      created_at: '2026-02-27T18:20:57.738Z',
    },
    {
      id: '74e5dce5-8b77-4cad-9b35-aeaaca012e5b',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: 'digistore24', discount_cents: 160, subtotal_cents: 1599, total_cents: 1439,
      payment_method: 'card', is_read: true, is_guest: false,
      created_at: '2026-02-27T18:45:14.066Z',
    },
    {
      id: '02318d47-98c2-4dbf-83f6-b6f310924d5c',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: 'digistore24', discount_cents: 460, subtotal_cents: 4597, total_cents: 4137,
      payment_method: 'card', is_read: true, is_guest: false,
      created_at: '2026-02-28T11:38:49.935Z',
    },
    {
      id: '4fa70e55-57fc-484e-b1eb-f6e31f11e038',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: null, discount_cents: 0, subtotal_cents: 1499, total_cents: 1499,
      payment_method: 'cash', is_read: true, is_guest: false,
      created_at: '2026-02-28T13:07:55.112Z',
    },
    {
      id: 'a726cfea-a783-4dd9-be30-36f970399760',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: null, discount_cents: 0, subtotal_cents: 3598, total_cents: 3598,
      payment_method: 'cash', is_read: true, is_guest: false,
      created_at: '2026-02-28T13:12:59.612Z',
    },
    {
      id: 'f9c95f1a-aa56-43c6-935f-835dfe619bc9',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: null, discount_cents: 0, subtotal_cents: 1499, total_cents: 1499,
      payment_method: 'cash', is_read: true, is_guest: false,
      created_at: '2026-02-28T13:19:01.728Z',
    },
    {
      id: 'a9a52b94-0d9e-4be1-aa11-6166fb083d37',
      user_id: null,
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: null, discount_cents: 0, subtotal_cents: 1499, total_cents: 1499,
      payment_method: 'cash', is_read: true, is_guest: true,
      created_at: '2026-02-28T15:50:27.071Z',
    },
    {
      id: 'deedd040-7a28-4176-8b9b-ae4159392eb2',
      user_id: null,
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: null, discount_cents: 0, subtotal_cents: 3402, total_cents: 3402,
      payment_method: 'cash', is_read: true, is_guest: true,
      created_at: '2026-02-28T17:40:12.382Z',
    },
    {
      id: 'fa264ab1-c68f-49dd-9976-8d48af381c72',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      customer_name: 'David', customer_surname: 'Kovač',
      delivery_address: 'Mis Irbijeve 12', phone: '+381603578913',
      promo_code: null, discount_cents: 0, subtotal_cents: 3198, total_cents: 3198,
      payment_method: 'card', is_read: true, is_guest: false,
      created_at: '2026-02-28T17:41:39.247Z',
    },
  ];

  for (const o of orders) {
    await query(
      `INSERT INTO orders
         (id, user_id, customer_name, customer_surname, delivery_address, phone,
          promo_code, discount_cents, subtotal_cents, total_cents,
          payment_method, is_read, is_guest, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        o.id, o.user_id, o.customer_name, o.customer_surname,
        o.delivery_address, o.phone, o.promo_code, o.discount_cents,
        o.subtotal_cents, o.total_cents, o.payment_method,
        o.is_read, o.is_guest, o.created_at,
      ]
    );
  }

  const items = [
    // Order f452876e (David, promo, Ethiopian x20 + Sumatra x2)
    { id: '4cfcf9ca-002a-4131-a57d-a2af76534769', order_id: 'f452876e-1f17-463f-ba12-e8d1aff7cbdd', product_id: '76f6749a-c8a1-4b04-8b48-ecaf014b8728', product_name_snapshot: 'Ethiopian Yirgacheffe', unit_price_cents_snapshot: 1699, weight_grams_snapshot: 250, quantity: 20 },
    { id: '087dae2c-d3e8-426b-98be-4ee86952552a', order_id: 'f452876e-1f17-463f-ba12-e8d1aff7cbdd', product_id: '2e052197-f95e-4563-8aec-9c3191fc6844', product_name_snapshot: 'Sumatra Mandheling',    unit_price_cents_snapshot: 1599, weight_grams_snapshot: 250, quantity: 2  },
    // Order bc7a46ef (David, promo, Sumatra x4 + deleted product x2 + Colombian x4)
    { id: '343f096c-eed8-42cb-92ba-0a3fecc61195', order_id: 'bc7a46ef-0020-493e-a528-7fc391a9f893', product_id: '2e052197-f95e-4563-8aec-9c3191fc6844', product_name_snapshot: 'Sumatra Mandheling',    unit_price_cents_snapshot: 1599, weight_grams_snapshot: 250, quantity: 4  },
    { id: '5658e4de-89b7-4bb9-b3f3-cc28c83bc2eb', order_id: 'bc7a46ef-0020-493e-a528-7fc391a9f893', product_id: null,                                    product_name_snapshot: 'Serbian-Turkish coffee', unit_price_cents_snapshot: 500,  weight_grams_snapshot: 200, quantity: 2  },
    { id: '820888b8-38c5-4aae-8a5b-814efb186d7d', order_id: 'bc7a46ef-0020-493e-a528-7fc391a9f893', product_id: 'a1fd6984-ea15-409e-aac0-75090d5e09be', product_name_snapshot: 'Colombian Supremo',     unit_price_cents_snapshot: 1499, weight_grams_snapshot: 500, quantity: 4  },
    // Order 70ad493c (David, promo, deleted product x3 + Colombian x3)
    { id: '1f66b1c8-d6c5-40ee-aefb-b71bba8478ec', order_id: '70ad493c-2aa5-4b9d-be3f-2566c386b060', product_id: null,                                    product_name_snapshot: 'Serbian-Turkish coffee', unit_price_cents_snapshot: 500,  weight_grams_snapshot: 200, quantity: 3  },
    { id: '689f5c56-bbac-4e7a-821a-54e9a738076c', order_id: '70ad493c-2aa5-4b9d-be3f-2566c386b060', product_id: 'a1fd6984-ea15-409e-aac0-75090d5e09be', product_name_snapshot: 'Colombian Supremo',     unit_price_cents_snapshot: 1499, weight_grams_snapshot: 500, quantity: 3  },
    // Order bec21f16 (David, promo, Colombian x3 + Guatemala x2)
    { id: 'ade898e9-9723-41bb-bc1c-3f35a687a81d', order_id: 'bec21f16-93ea-4af8-811b-83018ca36923', product_id: 'a1fd6984-ea15-409e-aac0-75090d5e09be', product_name_snapshot: 'Colombian Supremo',     unit_price_cents_snapshot: 1499, weight_grams_snapshot: 500, quantity: 3  },
    { id: 'c410a295-2c5d-403e-8fce-11a4e5b1f259', order_id: 'bec21f16-93ea-4af8-811b-83018ca36923', product_id: '59f27f3f-8771-4168-857f-023d17d918aa', product_name_snapshot: 'Guatemala Antigua',      unit_price_cents_snapshot: 1799, weight_grams_snapshot: 250, quantity: 2  },
    // Order 74e5dce5 (David, promo, Sumatra x1)
    { id: '3fd7089a-cf54-4df8-a9c8-3f975147df7a', order_id: '74e5dce5-8b77-4cad-9b35-aeaaca012e5b', product_id: '2e052197-f95e-4563-8aec-9c3191fc6844', product_name_snapshot: 'Sumatra Mandheling',    unit_price_cents_snapshot: 1599, weight_grams_snapshot: 250, quantity: 1  },
    // Order 02318d47 (David, promo, Sumatra x1 + Colombian x2)
    { id: '23ed0cc9-74ea-40a6-9601-a8381099dd5e', order_id: '02318d47-98c2-4dbf-83f6-b6f310924d5c', product_id: '2e052197-f95e-4563-8aec-9c3191fc6844', product_name_snapshot: 'Sumatra Mandheling',    unit_price_cents_snapshot: 1599, weight_grams_snapshot: 250, quantity: 1  },
    { id: 'b8360c48-7740-4e2b-b767-d3d776fdc782', order_id: '02318d47-98c2-4dbf-83f6-b6f310924d5c', product_id: 'a1fd6984-ea15-409e-aac0-75090d5e09be', product_name_snapshot: 'Colombian Supremo',     unit_price_cents_snapshot: 1499, weight_grams_snapshot: 500, quantity: 2  },
    // Order 4fa70e55 (David, Colombian x1)
    { id: '6314e90c-6d3c-459a-9515-dc1cf6373aea', order_id: '4fa70e55-57fc-484e-b1eb-f6e31f11e038', product_id: 'a1fd6984-ea15-409e-aac0-75090d5e09be', product_name_snapshot: 'Colombian Supremo',     unit_price_cents_snapshot: 1499, weight_grams_snapshot: 500, quantity: 1  },
    // Order a726cfea (David, Guatemala x2)
    { id: '15efdd55-ea07-434e-ae84-ecb8a4266235', order_id: 'a726cfea-a783-4dd9-be30-36f970399760', product_id: '59f27f3f-8771-4168-857f-023d17d918aa', product_name_snapshot: 'Guatemala Antigua',      unit_price_cents_snapshot: 1799, weight_grams_snapshot: 250, quantity: 2  },
    // Order f9c95f1a (David, Colombian x1)
    { id: '176f2c43-64e6-43dd-92f3-1de2584c3ed0', order_id: 'f9c95f1a-aa56-43c6-935f-835dfe619bc9', product_id: 'a1fd6984-ea15-409e-aac0-75090d5e09be', product_name_snapshot: 'Colombian Supremo',     unit_price_cents_snapshot: 1499, weight_grams_snapshot: 500, quantity: 1  },
    // Order a9a52b94 (guest, Colombian x1)
    { id: '8689fa11-7f1e-4696-bffb-6cdb3d5331b1', order_id: 'a9a52b94-0d9e-4be1-aa11-6166fb083d37', product_id: 'a1fd6984-ea15-409e-aac0-75090d5e09be', product_name_snapshot: 'Colombian Supremo',     unit_price_cents_snapshot: 1499, weight_grams_snapshot: 500, quantity: 1  },
    // Order deedd040 (guest, Ethiopian x2)
    { id: '294caa1f-3dae-4732-b7b0-4ec23fe49849', order_id: 'deedd040-7a28-4176-8b9b-ae4159392eb2', product_id: '76f6749a-c8a1-4b04-8b48-ecaf014b8728', product_name_snapshot: 'Ethiopian Yirgacheffe', unit_price_cents_snapshot: 1701, weight_grams_snapshot: 250, quantity: 2  },
    // Order fa264ab1 (David, Sumatra x2)
    { id: '6d693256-64b7-4bd0-b06a-a3ebd2828bee', order_id: 'fa264ab1-c68f-49dd-9976-8d48af381c72', product_id: '2e052197-f95e-4563-8aec-9c3191fc6844', product_name_snapshot: 'Sumatra Mandheling',    unit_price_cents_snapshot: 1599, weight_grams_snapshot: 250, quantity: 2  },
  ];

  for (const item of items) {
    await query(
      `INSERT INTO order_items
         (id, order_id, product_id, product_name_snapshot,
          unit_price_cents_snapshot, weight_grams_snapshot, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [item.id, item.order_id, item.product_id, item.product_name_snapshot,
       item.unit_price_cents_snapshot, item.weight_grams_snapshot, item.quantity]
    );
  }

  console.log(`✅ Seeded ${orders.length} orders and ${items.length} order items`);
}

// ── Reviews ──────────────────────────────────────────────────────────────────

async function seedReviews() {
  const { rows } = await query('SELECT COUNT(*) FROM reviews');
  if (parseInt(rows[0].count) > 0) {
    console.log('⏭  Reviews already exist, skipping.');
    return;
  }

  const reviews = [
    {
      id: 'ce426f20-267e-457a-bfc5-17f6014a98c0',
      user_id: '4576fa47-8557-41cf-8194-798cec1e84fd',
      rating: 5,
      body: 'This is amazing coffee shop! Best coffee ever! I will be always buying from this store!',
      created_at: '2026-02-27T18:52:32.991Z',
      updated_at: '2026-02-27T19:17:02.951Z',
    },
    {
      id: '8e57d9aa-99de-4f67-b1ec-d7cc1a2b6ecd',
      user_id: '58d177d0-5e28-4d00-adf2-ca7126c32bc6',
      rating: 5,
      body: 'I didnt like the smell of the Columbian coffee. Next time I will order Nygerian.',
      created_at: '2026-02-27T18:53:47.716Z',
      updated_at: '2026-02-27T18:53:47.716Z',
    },
  ];

  for (const r of reviews) {
    await query(
      `INSERT INTO reviews (id, user_id, rating, body, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [r.id, r.user_id, r.rating, r.body, r.created_at, r.updated_at]
    );
  }

  console.log(`✅ Seeded ${reviews.length} reviews`);
}

// ── Contact Messages ──────────────────────────────────────────────────────────

async function seedMessages() {
  const { rows } = await query('SELECT COUNT(*) FROM contact_messages');
  if (parseInt(rows[0].count) > 0) {
    console.log('⏭  Messages already exist, skipping.');
    return;
  }

  const messages = [
    {
      id: '3ad01ce9-16cf-4fee-8472-8015293ff726',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'Columbian coffee smell',
      body: 'Why Columbian coffee has that bad smell? Is it outdated?',
      is_read: true, reply: 'Because it is how Columbian coffee smells like..',
      replied_at: '2026-02-27T19:19:12.856Z', created_at: '2026-02-27T19:11:33.285Z',
    },
    {
      id: 'e4795048-e53a-46c8-a9dd-d5a4ea3b6caa',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'Delivery deadline',
      body: 'What is delivery deadline, when could I expect it?',
      is_read: true, reply: 'Within 24 hours from the order placement',
      replied_at: '2026-02-27T19:19:00.774Z', created_at: '2026-02-27T19:18:34.793Z',
    },
    {
      id: '6208bf81-6088-4948-9a63-bc9cb3e6b99f',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'message higlight test',
      body: 'This is a test',
      is_read: true, reply: 'this is another test for client messages tab highlighting',
      replied_at: '2026-02-28T12:33:17.001Z', created_at: '2026-02-28T12:22:36.800Z',
    },
    {
      id: '69f040d4-cc1e-433b-bd71-a065fe82b39d',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'test2', body: 'test 2 test 2',
      is_read: true, reply: 'answer 2 answer 2',
      replied_at: '2026-02-28T12:41:03.562Z', created_at: '2026-02-28T12:40:44.630Z',
    },
    {
      id: '8e9ce99b-dd4f-46e4-b617-794486052b71',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'test3', body: 'ddasdasdasdadsa',
      is_read: true, reply: 'replied replied',
      replied_at: '2026-02-28T12:44:06.162Z', created_at: '2026-02-28T12:43:21.802Z',
    },
    {
      id: '7d81a4a3-9dd5-4ce5-8cb5-72047d6a655a',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'test4', body: 'testtesttest',
      is_read: true, reply: 'reply reply reply',
      replied_at: '2026-02-28T12:48:00.348Z', created_at: '2026-02-28T12:47:34.920Z',
    },
    {
      id: '96709b92-4304-4102-af3e-d7b857ba1278',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'test test', body: 'testtesttest',
      is_read: true, reply: 'replyreplynewreply',
      replied_at: '2026-02-28T12:58:18.380Z', created_at: '2026-02-28T12:57:16.770Z',
    },
    {
      id: 'd986d6e7-3f9f-4d9b-9878-f8f4d4c1c604',
      name: 'Davidkovac1996', email: 'davidkovac1996@gmail.com',
      subject: 'message test', body: 'test test test',
      is_read: true, reply: 'reply test reply',
      replied_at: '2026-02-28T17:42:15.067Z', created_at: '2026-02-28T17:40:48.066Z',
    },
  ];

  for (const m of messages) {
    await query(
      `INSERT INTO contact_messages
         (id, name, email, subject, body, is_read, reply, replied_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [m.id, m.name, m.email, m.subject, m.body, m.is_read, m.reply, m.replied_at, m.created_at]
    );
  }

  console.log(`✅ Seeded ${messages.length} contact messages`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...');
  try {
    await runSchema();
    await seedUsers();
    await seedProducts();
    await seedOrders();
    await seedReviews();
    await seedMessages();
    console.log('🎉 Seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
