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
        <span className="task-detail">Size: {size}</span>
        {affectedTask && (
          <span className="task-detail">Affects: {affectedTask.name}</span>
        )}
      </div>
    </div>
  );
};
export default DefectCard;
