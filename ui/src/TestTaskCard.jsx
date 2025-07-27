import React from "react";
import "./Card.css";
import "./TestTaskCard.css";

const TestTaskCard = ({
  task,
  onChange,
  features,
  idx,
  testEffort,
  onDelete,
}) => {
  // Helper: is feature selectable for current action
  const isFeatureSelectable = (feature, task) => {
    // knowledge gathering can be done on all features
    if (["Knowledge Gathering"].includes(task.action)) {
      return true;
    }

    // risk assessment can be done on features that we have knowledge about
    if (["Risk Assessment"].includes(task.action)) {
      return feature.knowledge > 0;
    }

    // focused testing can be done on features that are already done
    if (
      [
        "Performance Testing",
        "Security Testing",
        "Usability Testing",
        "Exploratory Testing",
        "Functional Testing",
      ].includes(task.action)
    ) {
      return feature.isDone();
    }

    return false;
  };

  // Ensure selectedFeatures is always an array
  const selectedFeatures = Array.isArray(task.selectedFeatures)
    ? task.selectedFeatures
    : [];

  // When changing action, unselect features that become disabled
  const handleActionChange = (newAction) => {
    const newTask = { ...task, action: newAction };
    const newSelectable = features
      .filter((f) => isFeatureSelectable(f, newTask))
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
                  value="Knowledge Gathering"
                  checked={task.action === "Knowledge Gathering"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Knowledge Gathering
              </label>
            </li>
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Risk Assessment"
                  checked={task.action === "Risk Assessment"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Risk Assessment
              </label>
            </li>
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
                  value="Functional Testing"
                  checked={task.action === "Functional Testing"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Functional Testing
              </label>
            </li>
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Performance Testing"
                  checked={task.action === "Performance Testing"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Performance Testing
              </label>
            </li>
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Usability Testing"
                  checked={task.action === "Usability Testing"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Usability Testing
              </label>
            </li>
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Security Testing"
                  checked={task.action === "Security Testing"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Security Testing
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
                  style={{
                    opacity: isFeatureSelectable(feature, task) ? 1 : 0.5,
                  }}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.id)}
                      disabled={!isFeatureSelectable(feature, task)}
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
