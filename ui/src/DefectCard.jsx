import React from "react";
import "./Card.css";
import "./DefectCard.css";

const DefectCard = ({ name, size, complexity, severity, affectedTask }) => {
  return (
    <div className="task-card defect">
      <div className="task-header">
        <span className="task-title">{name}</span>
        <span className="task-type defect">Defect</span>
      </div>
      <div className="task-details">
        <span title="Size" className="task-detail">📦 {size}</span>
        {typeof complexity !== 'undefined' && (
          <span title="Complexity" className="task-detail">🧩 {complexity}</span>
        )}
        {typeof severity !== 'undefined' && (
          <span title="Severity" className="task-detail">🔥 {severity}</span>
        )}
        {affectedTask && (
          <span title="Affects" className="task-detail">🎯 {affectedTask.name}</span>
        )}
      </div>
    </div>
  );
};
export default DefectCard;
