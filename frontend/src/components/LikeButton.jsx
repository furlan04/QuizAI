import React, { useState, useEffect } from "react";
import { isLiked, likePost, unlikePost } from "../services/LikeService";
import { FaHeart } from "react-icons/fa";
import { getAuthToken } from "../services";
import "../styles/LikeButton.css"; // Importa il nuovo file CSS

const LikeButton = ({ postId, showFloatingHearts = true, continuousPulse = false }) => {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const fetchLikedStatus = async () => {
      const token = getAuthToken();
      setLoading(true);
      const result = await isLiked(postId, token);
      if (result.success) {
        setLiked(result.liked);
      } else {
        setError(result.message);
      }
      setLoading(false);
    };
    fetchLikedStatus();
  }, [postId]);

  const handleLikeToggle = async () => {
    const token = getAuthToken();
    setLoading(true);
    setIsAnimating(true);
    setShowRipple(true);
    
    let result;
    if (liked) {
      result = await unlikePost(postId, token);
    } else {
      result = await likePost(postId, token);
      // Mostra i cuori volanti solo quando si mette like
      if (showFloatingHearts) {
        setShowFloating(true);
        setTimeout(() => setShowFloating(false), 1500);
      }
    }

    if (result.success) {
      setLiked(!liked);
      setError(null);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
    
    // Reset animazioni
    setTimeout(() => {
      setIsAnimating(false);
      setShowRipple(false);
    }, 600);
  };

  const getHeartClasses = () => {
    let classes = "heart-icon";
    if (isAnimating) {
      classes += liked ? " unliked" : " liked";
    }
    if (liked && continuousPulse && !isAnimating) {
      classes += " pulsing";
    }
    return classes;
  };

  return (
    <div className="like-button-container">
      <button
        onClick={handleLikeToggle}
        disabled={loading}
        className={`like-button ${showRipple ? 'ripple' : ''}`}
      >
        <FaHeart 
          color={liked ? "#ff4757" : "#ccc"} 
          size={24}
          className={getHeartClasses()}
        />
      </button>
      
      {/* Cuori volanti */}
      {showFloating && (
        <div className="floating-hearts">
          <span className="floating-heart">♥</span>
          <span className="floating-heart">♥</span>
          <span className="floating-heart">♥</span>
        </div>
      )}
      
      {error && (
        <p className="error-message">
          {error}
        </p>
      )}
    </div>
  );
};

export default LikeButton;