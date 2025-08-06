import React from "react";
import "./Card.css";
import "./DefectCard.css";

const DefectCard = ({ task }) => {
  return (
    <div className="task-card defect">
      <div className="task-header">
        <span className="task-title">{task.name}</span>
        <span className="task-type defect">Defect</span>
      </div>
      <div className="task-details">
        <span title="Size" className="task-detail" data-content={task.size}>📦 Size: {task.size}</span>
        <span title="Complexity" className="task-detail" data-content={task.complexity}>🧩 Complexity: {task.complexity}</span>
      </div>
    </div>
  );
};
export default DefectCard;
