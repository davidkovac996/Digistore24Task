import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './HomePage.css';


function Stars({ rating, interactive = false, onSet, onHover, hovered }) {
  return (
    <div className="stars-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn${n <= (interactive ? (hovered || rating) : rating) ? ' lit' : ''}`}
          onClick={interactive ? () => onSet(n) : undefined}
          onMouseEnter={interactive ? () => onHover(n) : undefined}
          onMouseLeave={interactive ? () => onHover(0) : undefined}
          disabled={!interactive}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function reviewerName(email) {
  const local = email.split('@')[0].replace(/[._-]/g, ' ');
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const deleteReview = async (id) => {
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((rv) => rv.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const isAdmin = user?.role === 'admin';

  const handleShopNow = () => {
    if (isAdmin) return;
    if (user || isGuest) navigate('/shop');
    else navigate('/register');
  };

  useEffect(() => {
    api.get('/reviews').then((r) => {
      setReviews(r.data.reviews);
      if (user) {
        const mine = r.data.reviews.find((rv) => rv.email === user.email);
        if (mine) {
          setMyReview(mine);
          setRating(mine.rating);
          setBody(mine.body);
        }
      }
    });
  }, [user]);

  const submitReview = async () => {
    setFormError('');
    setFormSuccess('');
    if (!body.trim() || body.trim().length < 10) {
      setFormError('Please write at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.post('/reviews', { rating, body: body.trim() });
      const saved = { ...r.data.review, email: user.email };
      setMyReview(saved);
      setReviews((prev) => {
        const without = prev.filter((rv) => rv.email !== user.email);
        return [saved, ...without];
      });
      setEditing(false);
      setFormSuccess(myReview ? 'Review updated!' : 'Review submitted — thank you!');
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = () => {
    setEditing(true);
    setFormSuccess('');
    setFormError('');
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormError('');
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body);
    }
  };

  return (
    <div className="home">

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Est. 1998 · Single-Origin Specialists</div>
          <h1 className="hero-title">
            Life's too short<br />for <em>bad coffee.</em>
          </h1>
          <p className="hero-sub">
            For over 25 years, Bean &amp; Brew has sourced the world's finest single-origin beans,
            roasted in small batches every week. From the highlands of Ethiopia to the valleys
            of Colombia — every cup tells a story worth savoring.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={handleShopNow} disabled={isAdmin}>
              Shop Our Coffees
            </button>
            <a href="#story" className="btn btn-ghost btn-lg">Our Story &rarr;</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-img-wrap">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=85"
            >
              <source src="/coffee.mp4" type="video/mp4" />
            </video>
            <div className="hero-img-badge">
              <span className="badge-num">25+</span>
              <span className="badge-txt">Years of<br />Excellence</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="stat">
          <span className="stat-num">25+</span>
          <span className="stat-label">Years Roasting</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">18</span>
          <span className="stat-label">Origins Sourced</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">40k+</span>
          <span className="stat-label">Happy Customers</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-num">100%</span>
          <span className="stat-label">Ethically Sourced</span>
        </div>
      </section>

      {/* WHY US */}
      <section className="why-us" id="story">
        <div className="section-inner">
          <div className="section-label">Why Bean &amp; Brew</div>
          <h2 className="section-title">Obsessed with every detail.<br />From farm to your cup.</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Direct Trade</h3>
              <p>We work directly with farmers in 18 countries, cutting out the middlemen and ensuring fair wages for the people who grow your coffee.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔥</div>
              <h3>Small-Batch Roasting</h3>
              <p>Every batch is roasted fresh to order in our Lisbon roastery. We never let beans sit on shelves for weeks — you taste the difference immediately.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Shipped Within 24h</h3>
              <p>Your order ships within 24 hours of roasting. We use nitrogen-flushed, resealable bags that lock in freshness from the moment we seal them.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Satisfaction Guaranteed</h3>
              <p>Not in love with your order? We'll replace it or refund you — no questions asked. We've been standing behind our coffee since 1998.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="story-section">
        <div className="story-inner">
          <div className="story-img">
            <img
              src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&q=85"
              alt="Our roastery"
            />
          </div>
          <div className="story-text">
            <div className="section-label">Our Story</div>
            <h2>Started with one roaster.<br />Grown by passion.</h2>
            <p>
              It was 1998 when founder Marco Ferreira drove a second-hand roaster into a rented
              garage in Lisbon and roasted his first batch of Yirgacheffe. He gave bags to
              neighbors. They came back asking for more.
            </p>
            <p>
              Twenty-five years later, Bean &amp; Brew ships to over 30 countries, but the philosophy
              hasn't changed: source the best beans on earth, roast them with care, and let the
              coffee speak for itself.
            </p>
            <p>
              We believe great coffee isn't a luxury — it's a daily ritual worth doing right.
              And we're here to make sure yours is extraordinary, every single morning.
            </p>
            <button className="btn btn-primary" onClick={handleShopNow} disabled={isAdmin}>
              Explore Our Coffees
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="section-inner">
          <div className="section-label">What People Say</div>
          <h2 className="section-title">Hear it from<br />our customers.</h2>

          {reviews.length > 0 ? (
            <div className="community-grid">
              {reviews.map((rv) => (
                <div className={`community-card${user?.role === 'admin' ? ' is-admin' : ''}`} key={rv.id}>
                  <div className="community-card-header">
                    <div className="community-avatar">{reviewerName(rv.email).charAt(0)}</div>
                    <div>
                      <div className="community-name">{reviewerName(rv.email)}</div>
                      <div className="community-time">{timeAgo(rv.updated_at || rv.created_at)}</div>
                    </div>
                    <div className="community-stars">
                      {'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}
                    </div>
                  </div>
                  <p className="community-body">"{rv.body}"</p>
                  {user?.role === 'admin' && (
                    <div className="review-admin-actions">
                      {confirmDeleteId === rv.id ? (
                        <>
                          <span className="review-delete-confirm-text">Sure?</span>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteReview(rv.id)}>Yes</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteId(null)}>No</button>
                        </>
                      ) : (
                        <button className="review-delete-btn" onClick={() => setConfirmDeleteId(rv.id)} title="Delete review">
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="reviews-empty">
              <div className="reviews-empty-icon">☕</div>
              <p>No reviews yet — be the first to share your experience!</p>
            </div>
          )}

          {/* Review form / prompt */}
          <div className="review-zone">
            {!user ? (
              <div className="review-prompt">
                <span>Tried our coffee?</span>
                <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                  Log in to leave a review
                </button>
              </div>
            ) : user.role === 'admin' ? null : myReview && !editing ? (
              <div className="my-review-card">
                <div className="my-review-header">
                  <span className="my-review-label">Your Review</span>
                  <button className="btn btn-ghost btn-sm" onClick={startEdit}>Edit</button>
                </div>
                <Stars rating={myReview.rating} />
                <p className="my-review-body">"{myReview.body}"</p>
                {formSuccess && <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>{formSuccess}</div>}
              </div>
            ) : (
              <div className="review-form-card">
                <h3>{myReview ? 'Edit Your Review' : 'Leave a Review'}</h3>
                <p className="review-form-sub">How was your experience with Bean &amp; Brew?</p>

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="form-label">Your Rating</label>
                  <Stars
                    rating={rating}
                    interactive
                    onSet={setRating}
                    onHover={setHovered}
                    hovered={hovered}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Your Review <span className="char-count">{body.length}/500</span></label>
                  <textarea
                    className="form-input review-textarea"
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 500))}
                    placeholder="Tell us about your experience — which coffee, what you loved..."
                    rows={4}
                  />
                </div>

                {formError && <div className="alert alert-error">{formError}</div>}

                <div className="review-form-actions">
                  {myReview && (
                    <button className="btn btn-ghost" onClick={cancelEdit} disabled={submitting}>
                      Cancel
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={submitReview} disabled={submitting}>
                    {submitting ? <span className="spinner" /> : myReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="cta-inner">
          <h2>Your best cup of coffee<br />is one click away.</h2>
          <p>Join 40,000+ coffee lovers who've made the switch. Free shipping on every order.</p>
          <button className="btn btn-primary btn-lg" onClick={handleShopNow} disabled={isAdmin}>
            Start Shopping
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-col">
            <span className="footer-logo">&#9749; Bean &amp; Brew</span>
            <p className="footer-tagline">Roasted with love in Lisbon since 1998.<br />Single-origin. Small-batch. Always fresh.</p>
          </div>
          <div className="footer-col">
            <h5>Contact Us</h5>
            <ul className="footer-list">
              <li>&#128231; <a href="mailto:support@beanandbrew.com">support@beanandbrew.com</a></li>
              <li>&#128222; <a href="tel:+351210123456">+351 210 123 456</a></li>
              <li>&#128336; Mon-Fri, 9:00 - 18:00 (WET)</li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Find Us</h5>
            <ul className="footer-list">
              <li>&#128205; Rua do Cafe 42, 1200-001</li>
              <li>Lisbon, Portugal</li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Company Info</h5>
            <ul className="footer-list">
              <li>Reg. No: PT 508 123 456</li>
              <li>VAT: PT508123456</li>
              <li>Bean &amp; Brew Lda.</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">&#169; {new Date().getFullYear()} Bean &amp; Brew. All rights reserved.</p>
          <div className="footer-links">
            <span className="footer-link-disabled">Privacy Policy</span>
            <span className="footer-link-disabled">Terms of Service</span>
            <span className="footer-link-disabled">Cookie Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
