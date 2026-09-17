import { Link } from 'react-router-dom';

export function Home() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          <span>Fresh Flowers</span>
          <span>Delivered</span>
        </h1>
        <p>
          Discover our seasonal collection of premium flowers, carefully selected
          and arranged for every occasion.
        </p>
        <div className="hero-buttons">
          <Link to="/shop" className="btn btn-primary">
            Browse Collection
          </Link>
          <Link to="/register" className="btn btn-outline">
            Sell Your Flowers
          </Link>
        </div>
      </div>
      <div className="flower-decoration flower-left">🌸</div>
      <div className="flower-decoration flower-right">🌺</div>
    </section>
  );
}
