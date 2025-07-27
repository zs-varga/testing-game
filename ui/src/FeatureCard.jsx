import React from "react";
import "./Card.css";
import "./FeatureCard.css";

const FeatureCard = ({
  name,
  size,
  complexity,
  knowledge = 0,
  riskKnowledge = 0,
  risks = [],
}) => {
  const riskEntries = Object.entries(risks)
    .filter(([_, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="task-card feature">
      <div className="task-header">
        <span className="task-title">{name}</span>
        <span className="task-type feature">Feature</span>
      </div>
      <div className="task-details">
        {knowledge > 0 && <span className="task-detail">Size: {size}</span>}
        {knowledge > 0.3 && (
          <span className="task-detail">Complexity: {complexity}</span>
        )}
        {riskKnowledge > 0 && riskKnowledge < 0.8 && riskEntries.length > 0 && (
          <span className="task-detail">Risk: {riskEntries[0][0]}</span>
        )}
        {riskKnowledge > 0.8 && riskEntries.length > 0 && (
          <span className="task-detail">
            Risk(s): {riskEntries.map(([k, v]) => `${k}`).join(" > ")}
          </span>
        )}
      </div>
    </div>
  );
};
export default FeatureCard;
