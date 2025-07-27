import React from "react";
import "./Card.css";
import "./DefectCard.css";

const DefectCard = ({ name, size, complexity, severity }) => {
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
};
export default DefectCard;
