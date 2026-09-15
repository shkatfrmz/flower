import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="hero-accent">Fresh</span> Flowers
          <br />
          <span className="hero-accent">Delivered</span> to Your Door
        </h1>
        <p className="hero-description">
          Discover our seasonal collection of premium flowers, carefully selected
          and arranged for every occasion.
        </p>
        <div className="hero-buttons">
          <Link to="/shop" className="btn-primary">
            Browse Collection
          </Link>
          <Link to="/register" className="btn-secondary">
            Sell Your Flowers
          </Link>
        </div>
      </div>
      <div className="flower-decoration flower-left">
        <div className="flower">🌸</div>
        <div className="flower">🌺</div>
        <div className="flower">🌼</div>
        <div className="flower">🌷</div>
        <div className="flower">🌻</div>
      </div>
      <div className="flower-decoration flower-right">
        <div className="flower">🌺</div>
        <div className="flower">🌻</div>
        <div className="flower">🌷</div>
        <div className="flower">🌼</div>
        <div className="flower">🌸</div>
      </div>
    </section>
  );
}