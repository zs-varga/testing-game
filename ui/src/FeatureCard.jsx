import React from "react";
import "./Card.css";
import "./FeatureCard.css";

const FeatureCard = ({ task }) => {
  const riskEntries = Object.entries(task.risks)
    .filter(([_, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="task-card feature">
      <div className="task-header">
        <span className="task-title">{task.name}</span>
        <span className="task-type feature">Feature</span>
      </div>
      <div className="task-details">
        {task.knowledge > 0 && (
          <span title="Size" className="task-detail">📦 {task.size}</span>
        )}
        {task.knowledge > 0.3 && (
          <span title="Complexity" className="task-detail">🧩 {task.complexity}</span>
        )}
        {task.knowledge > 0.5 && (
          <span title="Found Defects" className="task-detail">🐞 {task.getFoundDefects().length}</span>
        )}
        {task.riskKnowledge > 0 && riskEntries.length > 0 && (
          <span title="Risk" className="task-detail">
            ⚠️ {task.riskKnowledge > 0.8
              ? riskEntries.map(([k, v]) => `${k}`).join(" > ")
              : riskEntries[0][0]}              
          </span>
        )}
      </div>
    </div>
  );
};
export default FeatureCard;
