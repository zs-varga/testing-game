import React from "react";
import "./Card.css";

export function FeatureCard({ name, size, complexity, knowledge = 0, risks = [] }) {
  // risks is always an object: convert to array of key-value pairs with nonzero values and sort descending
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
        {knowledge > 0.3 && <span className="task-detail">Complexity: {complexity}</span>}
        {knowledge > 0.5 && knowledge < 0.8 && riskEntries.length > 0 && (
          <span className="task-detail">Risk: {riskEntries[0][0]}</span>
        )}
        {knowledge > 0.8 && riskEntries.length > 0 && (
          <span className="task-detail">
            Risk(s): {riskEntries.map(([k, v]) => `${k}`).join(" > ")} 
          </span>
        )}
      </div>
    </div>
  );
}

export function DefectCard({ name, size, complexity, severity }) {
  return (
    <div className="task-card defect">
      <div className="task-header">
        <span className="task-title">{name}</span>
        <span className="task-type defect">Defect</span>
      </div>
      <div className="task-details">
        <span className="task-detail">Size: {size}</span>
        <span className="task-detail">Severity: {severity}</span>
      </div>
    </div>
  );
}
