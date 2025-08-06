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
        <span title="Size" className="task-detail">📦 {task.size}</span>
        {typeof task.complexity !== 'undefined' && (
          <span title="Complexity" className="task-detail">🧩 {task.complexity}</span>
        )}
        {typeof task.severity !== 'undefined' && (
          <span title="Severity" className="task-detail">🔥 {task.severity}</span>
        )}
        {task.affectedTask && (
          <span title="Affects" className="task-detail">🎯 {task.affectedTask.name}</span>
        )}
      </div>
    </div>
  );
};
export default DefectCard;
