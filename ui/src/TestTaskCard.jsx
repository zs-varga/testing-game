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

  // Compute selectable feature IDs
  const selectableFeatureIds = features
    .filter((f) => f.getType && f.getType() === "Feature" && isFeatureSelectable(f, task))
    .map((f) => f.id);

  const allSelected = selectableFeatureIds.length > 0 && selectableFeatureIds.every((id) => selectedFeatures.includes(id));

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onChange({ ...task, selectedFeatures: selectedFeatures.filter((id) => !selectableFeatureIds.includes(id)) });
    } else {
      // Select all
      const newSelected = Array.from(new Set([...selectedFeatures, ...selectableFeatureIds]));
      onChange({ ...task, selectedFeatures: newSelected });
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
          <select
            className="action-select"
            value={task.action}
            onChange={(e) => handleActionChange(e.target.value)}
          >
            <option value="Knowledge Gathering">Knowledge Gathering</option>
            <option value="Risk Assessment">Risk Assessment</option>
            <option value="Exploratory Testing">Exploratory Testing</option>
            <option value="Functional Testing">Functional Testing</option>
            <option value="Performance Testing">Performance Testing</option>
            <option value="Usability Testing">Usability Testing</option>
            <option value="Security Testing">Security Testing</option>
          </select>
        </div>
        <div className="feature-multiselect field-group vertical">
          <label className="field-label">Focus</label>
          <ul className="feature-list">
            <li className="feature-list-select-all">
              <label>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  disabled={selectableFeatureIds.length === 0}
                /> Select All
              </label>
            </li>
            {features
              .filter((f) => f.getType && f.getType() === "Feature")
              .sort((a, b) => a.id - b.id)
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
