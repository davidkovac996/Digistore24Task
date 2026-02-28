const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Postgre123!@localhost:5432/brewedtrue'
});

pool.query("SELECT email, password_hash FROM users WHERE email = 'admin@brewedtrue.com'")
  .then(r => {
    const user = r.rows[0];
    console.log('User found:', !!user);
    if (user) {
      console.log('Hash:', user.password_hash);
      const match = bcrypt.compareSync('Admin1234!', user.password_hash);
      console.log('Password match:', match);
    }
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    pool.end();
  });
