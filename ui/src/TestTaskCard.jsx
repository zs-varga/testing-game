import React from "react";
import "./Card.css";
import "./TestTaskCard.css";

const TestTaskCard = ({ task, onChange, features, idx, testEffort, onDelete }) => {
  // Helper: is feature selectable for current action
  const isFeatureSelectable = (feature) => {
    if (task.action === "Knowledge Gathering") return true;
    if (task.action === "Exploratory Testing")
      return feature.isDone && feature.isDone();
    return false;
  };

  // Ensure selectedFeatures is always an array
  const selectedFeatures = Array.isArray(task.selectedFeatures)
    ? task.selectedFeatures
    : [];

  // When changing action, unselect features that become disabled
  const handleActionChange = (newAction) => {
    const newSelectable = features
      .filter((f) => {
        if (newAction === "Knowledge Gathering") return true;
        if (newAction === "Exploratory Testing") return f.isDone && f.isDone();
        return false;
      })
      .map((f) => f.id);
    const filteredSelected = selectedFeatures.filter((id) =>
      newSelectable.includes(id)
    );
    onChange({
      ...task,
      action: newAction,
      selectedFeatures: filteredSelected,
    });
  };

  const handleFeatureToggle = (featureId) => {
    if (selectedFeatures.includes(featureId)) {
      onChange({
        ...task,
        selectedFeatures: selectedFeatures.filter((id) => id !== featureId),
      });
    } else {
      onChange({ ...task, selectedFeatures: [...selectedFeatures, featureId] });
    }
  };

  return (
    <div className="task-card test-task">
      <div className="task-header">
        <span className="task-title test-task-title">Test Task</span>
        <button
          className="delete-task-btn"
          title="Delete Task"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      <div className="task-details">
        <div className="field-group vertical">
          <label className="field-label">Effort</label>
          <div className="effort-slider-container">
            <input
              type="range"
              min={1}
              max={testEffort}
              value={task.effort}
              onChange={(e) =>
                onChange({ ...task, effort: Number(e.target.value) })
              }
              className="effort-slider"
            />
            <span className="effort-label">{task.effort}</span>
          </div>
        </div>
        <div className="field-group vertical">
          <label className="field-label">Action</label>
          <ul className="action-list">
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Exploratory Testing"
                  checked={task.action === "Exploratory Testing"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Exploratory Testing
              </label>
            </li>
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Knowledge Gathering"
                  checked={task.action === "Knowledge Gathering"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Knowledge Gathering
              </label>
            </li>
          </ul>
        </div>
        <div className="feature-multiselect field-group vertical">
          <label className="field-label">Focus</label>
          <ul className="feature-list">
            {features
              .filter((f) => f.getType && f.getType() === "Feature")
              .map((feature) => (
                <li
                  key={feature.id}
                  style={{ opacity: isFeatureSelectable(feature) ? 1 : 0.5 }}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.id)}
                      disabled={!isFeatureSelectable(feature)}
                      onChange={() => handleFeatureToggle(feature.id)}
                    />{" "}
                    {feature.name}
                  </label>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
export default TestTaskCard;
