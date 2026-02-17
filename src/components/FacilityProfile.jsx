import { useState } from "react";

const DEMO_FACILITY = {
  name: "The Grand Meridian Spa & Wellness",
  image: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1200&q=80",
  rating: 4.7,
  reviewCount: 328,
  address: "42 Rustaveli Avenue, Tbilisi, Georgia",
};

const StarRating = ({ rating, size = 18 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill =
      i <= Math.floor(rating)
        ? 1
        : i === Math.ceil(rating)
        ? rating % 1
        : 0;

    stars.push(
      <span key={i} style={{ position: "relative", display: "inline-block", width: size, height: size, marginRight: 2 }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="#2a2a2a"
            opacity="0.08"
          />
        </svg>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="#D4A053"
          />
        </svg>
      </span>
    );
  }
  return <span style={{ display: "inline-flex", alignItems: "center" }}>{stars}</span>;
};

export default function FacilityProfile() {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const facility = DEMO_FACILITY;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F0EB",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "40px 16px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet" />

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#FFFFFF",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: isHovered
            ? "0 32px 64px rgba(42,42,42,0.12), 0 8px 20px rgba(42,42,42,0.06)"
            : "0 16px 48px rgba(42,42,42,0.08), 0 4px 12px rgba(42,42,42,0.04)",
          transition: "box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        }}
      >
        {/* Hero Image */}
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          overflow: "hidden",
          background: "#E8E0D8",
        }}>
          <img
            src={facility.image}
            alt={facility.name}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.8s ease, transform 6s ease",
              transform: isHovered ? "scale(1.04)" : "scale(1)",
            }}
          />

          {/* Bottom gradient for smooth blend */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
          }} />

          {/* Top-right badge */}
          <div style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 12,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#D4A053">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#2a2a2a",
              letterSpacing: "-0.01em",
            }}>
              {facility.rating}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 28px 32px" }}>
          {/* Decorative accent line */}
          <div style={{
            width: 36,
            height: 3,
            background: "linear-gradient(90deg, #D4A053, #C08B3F)",
            borderRadius: 4,
            marginBottom: 16,
          }} />

          {/* Facility Name */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            fontWeight: 500,
            color: "#1A1A1A",
            lineHeight: 1.2,
            margin: "0 0 14px 0",
            letterSpacing: "-0.02em",
          }}>
            {facility.name}
          </h1>

          {/* Rating Row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}>
            <StarRating rating={facility.rating} size={17} />
            <span style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#1A1A1A",
              letterSpacing: "-0.01em",
            }}>
              {facility.rating}
            </span>
            <span style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#C4B9AD",
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 14,
              color: "#8A7F73",
              fontWeight: 400,
            }}>
              {facility.reviewCount} reviews
            </span>
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: "linear-gradient(90deg, #E8E0D8, transparent)",
            marginBottom: 16,
          }} />

          {/* Address */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B0A496"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginTop: 2, flexShrink: 0 }}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{
              fontSize: 14,
              color: "#8A7F73",
              lineHeight: 1.5,
              letterSpacing: "0.01em",
            }}>
              {facility.address}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
