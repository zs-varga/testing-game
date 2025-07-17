import React from "react";
import "./Card.css";

export function FeatureCard({ name, size, complexity }) {
  return (
    <div className="task-card feature">
      <div className="task-header">
        <span className="task-title">{name}</span>
        <span className="task-type feature">Feature</span>
      </div>
      <div className="task-details">
        <span className="task-detail">Size: {size}</span>
        <span className="task-detail">Complexity: {complexity}</span>
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
        <span className="task-detail">Complexity: {complexity}</span>
        <span className="task-detail">Severity: {severity}</span>
      </div>
    </div>
  );
}
